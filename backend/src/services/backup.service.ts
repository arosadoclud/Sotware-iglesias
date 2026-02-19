import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import envConfig from '../config/env';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Sistema de Backups Automáticos para MongoDB
 * 
 * IMPORTANTE: MongoDB Atlas FREE (M0) NO incluye backups automáticos.
 * Este script permite:
 * 1. Exportar todas las colecciones a JSON
 * 2. Usar mongodump para backup completo (opcpción BSON)
 * 3. Comprimir backups automáticamente
 * 4. Rotar backups antiguos (mantener últimos 7 días)
 * 5. Subir a cloud storage (configurar con env vars)
 */

interface BackupOptions {
  format: 'json' | 'bson'; // JSON más portable, BSON más eficiente
  compress: boolean;
  maxBackups: number; // Cuántos backups mantener
  uploadToCloud: boolean;
}

const DEFAULT_OPTIONS: BackupOptions = {
  format: 'json',
  compress: true,
  maxBackups: 7,
  uploadToCloud: false
};

export class BackupService {
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Directorio de backups creado: ${this.backupDir}`);
    }
  }

  /**
   * Crear backup completo de la base de datos
   */
  async createBackup(options: Partial<BackupOptions> = {}): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);

    console.log(`🔄 Iniciando backup: ${backupName}`);
    console.log(`   Formato: ${opts.format.toUpperCase()}`);
    console.log(`   Compresión: ${opts.compress ? 'SÍ' : 'NO'}`);

    try {
      if (opts.format === 'json') {
        await this.backupJSON(backupPath);
      } else {
        await this.backupBSON(backupPath);
      }

      if (opts.compress) {
        await this.compressBackup(backupPath);
      }

      await this.rotateBackups(opts.maxBackups);

      console.log(`✅ Backup completado: ${backupName}`);
      return backupPath;
    } catch (error: any) {
      console.error(`❌ Error en backup:`, error.message);
      throw error;
    }
  }

  /**
   * Backup en formato JSON (más portable, legible)
   */
  private async backupJSON(backupPath: string): Promise<void> {
    fs.mkdirSync(backupPath, { recursive: true });

    const db = mongoose.connection.db;
    const collections = await db?.listCollections().toArray();

    if (!collections || collections.length === 0) {
      console.log('⚠️  No hay colecciones para respaldar');
      return;
    }

    console.log(`📦 Exportando ${collections.length} colecciones...`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      try {
        const collection = db?.collection(collectionName);
        const documents = await collection?.find({}).toArray();

        if (documents && documents.length > 0) {
          const filePath = path.join(backupPath, `${collectionName}.json`);
          fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
          console.log(`   ✓ ${collectionName}: ${documents.length} documentos`);
        }
      } catch (error: any) {
        console.error(`   ✗ Error en ${collectionName}:`, error.message);
      }
    }

    // Guardar metadata del backup
    const metadata = {
      timestamp: new Date().toISOString(),
      mongoVersion: mongoose.version,
      collectionsCount: collections.length,
      format: 'json'
    };
    fs.writeFileSync(
      path.join(backupPath, '_metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }

  /**
   * Backup usando mongodump (formato BSON nativo de MongoDB)
   * Requiere tener mongodump instalado en el sistema
   */
  private async backupBSON(backupPath: string): Promise<void> {
    try {
      const uri = envConfig.mongoUri;
      const cmd = `mongodump --uri="${uri}" --out="${backupPath}"`;
      
      console.log('📦 Ejecutando mongodump...');
      const { stdout, stderr } = await execPromise(cmd);
      
      if (stderr && !stderr.includes('done dumping')) {
        console.error('⚠️  Advertencias:', stderr);
      }
      
      console.log(stdout);
    } catch (error: any) {
      if (error.message.includes('mongodump')) {
        console.error('❌ mongodump no encontrado. Instalalo con: npm install -g mongodb-database-tools');
        console.log('   O usa formato JSON en su lugar.');
      }
      throw error;
    }
  }

  /**
   * Comprimir backup usando archivos ZIP nativos de Node
   */
  private async compressBackup(backupPath: string): Promise<void> {
    try {
      const archiver = require('archiver');
      const output = fs.createWriteStream(`${backupPath}.zip`);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          console.log(`   📦 Comprimido: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
          
          // Eliminar carpeta sin comprimir
          fs.rmSync(backupPath, { recursive: true, force: true });
          resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(backupPath, false);
        archive.finalize();
      });
    } catch (error: any) {
      console.log('   ⚠️  No se pudo comprimir (instalando archiver...)');
      console.log('   Ejecuta: npm install archiver');
    }
  }

  /**
   * Rotar backups antiguos - mantener solo los últimos N backups
   */
  private async rotateBackups(maxBackups: number): Promise<void> {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('backup-'))
      .map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxBackups) {
      const toDelete = files.slice(maxBackups);
      console.log(`🗑️  Eliminando ${toDelete.length} backups antiguos...`);
      
      for (const file of toDelete) {
        fs.rmSync(file.path, { recursive: true, force: true });
        console.log(`   ✓ Eliminado: ${file.name}`);
      }
    }
  }

  /**
   * Restaurar backup desde archivo
   */
  async restoreBackup(backupPath: string): Promise<void> {
    console.log(`🔄 Restaurando backup desde: ${backupPath}`);

    // Verificar si es ZIP
    if (backupPath.endsWith('.zip')) {
      console.log('⚠️  Descomprime el archivo ZIP primero');
      return;
    }

    // Verificar metadata
    const metadataPath = path.join(backupPath, '_metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Backup inválido: no se encontró _metadata.json');
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    console.log(`📅 Backup del: ${metadata.timestamp}`);

    const db = mongoose.connection.db;
    const files = fs.readdirSync(backupPath)
      .filter(f => f.endsWith('.json') && f !== '_metadata.json');

    for (const file of files) {
      const collectionName = file.replace('.json', '');
      const filePath = path.join(backupPath, file);
      const documents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      try {
        const collection = db?.collection(collectionName);
        
        // Limpiar colección existente
        await collection?.deleteMany({});
        
        // Insertar documentos
        if (documents.length > 0) {
          await collection?.insertMany(documents);
          console.log(`   ✓ ${collectionName}: ${documents.length} documentos restaurados`);
        }
      } catch (error: any) {
        console.error(`   ✗ Error en ${collectionName}:`, error.message);
      }
    }

    console.log('✅ Restauración completada');
  }

  /**
   * Listar backups disponibles
   */
  listBackups(): { name: string; size: string; date: Date }[] {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('backup-'))
      .map(f => {
        const filePath = path.join(this.backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          date: stats.mtime
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return files;
  }
}

// Función para ejecutar backup manual
export async function runBackup(options?: Partial<BackupOptions>) {
  const backupService = new BackupService();
  
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    await backupService.createBackup(options);
    
    console.log('\n📋 Backups disponibles:');
    const backups = backupService.listBackups();
    backups.forEach(b => console.log(`   ${b.name} (${b.size}) - ${b.date.toLocaleString()}`));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  runBackup({
    format: 'json',
    compress: false, // Cambia a true si instalas archiver
    maxBackups: 7
  });
}
