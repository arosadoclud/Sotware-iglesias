# Estructura del Proyecto: Church Program Manager

```
church-program-manager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── env.ts
│   │   │   └── cloudinary.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── errorHandler.middleware.ts
│   │   ├── models/
│   │   │   ├── Church.model.ts
│   │   │   ├── User.model.ts
│   │   │   ├── Person.model.ts
│   │   │   ├── Role.model.ts
│   │   │   ├── ActivityType.model.ts
│   │   │   ├── Program.model.ts
│   │   │   ├── LetterTemplate.model.ts
│   │   │   └── GeneratedLetter.model.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── auth.validators.ts
│   │   │   ├── persons/
│   │   │   │   ├── persons.controller.ts
│   │   │   │   ├── persons.service.ts
│   │   │   │   ├── persons.routes.ts
│   │   │   │   └── persons.validators.ts
│   │   │   ├── programs/
│   │   │   │   ├── programs.controller.ts
│   │   │   │   ├── programs.service.ts
│   │   │   │   ├── algorithm.service.ts
│   │   │   │   ├── pdf.service.ts
│   │   │   │   ├── programs.routes.ts
│   │   │   │   └── programs.validators.ts
│   │   │   ├── activities/
│   │   │   │   ├── activities.controller.ts
│   │   │   │   ├── activities.service.ts
│   │   │   │   ├── activities.routes.ts
│   │   │   │   └── activities.validators.ts
│   │   │   ├── letters/
│   │   │   │   ├── letters.controller.ts
│   │   │   │   ├── letters.service.ts
│   │   │   │   ├── letters.routes.ts
│   │   │   │   └── letters.validators.ts
│   │   │   └── reports/
│   │   │       ├── reports.controller.ts
│   │   │       ├── reports.service.ts
│   │   │       └── reports.routes.ts
│   │   ├── types/
│   │   │   ├── express.d.ts
│   │   │   ├── common.types.ts
│   │   │   └── models.types.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   ├── jwt.ts
│   │   │   └── validators.ts
│   │   ├── templates/
│   │   │   └── pdf/
│   │   │       ├── program.html
│   │   │       ├── letter.html
│   │   │       └── styles.css
│   │   ├── app.ts
│   │   └── server.ts
│   ├── uploads/
│   │   ├── programs/
│   │   └── letters/
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── algorithm.test.ts
│   │   │   └── services/
│   │   └── integration/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── persons/
│   │   │   ├── programs/
│   │   │   ├── letters/
│   │   │   └── shared/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── store/
│   │   ├── routes/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── README.md
```

## Próximos pasos de implementación:
1. ✅ Backend: Configuración y modelos
2. Backend: Servicios y controladores
3. Backend: Algoritmo de asignación
4. Frontend: Setup inicial
5. Frontend: Componentes UI
6. Integración y testing
