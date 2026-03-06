---

## Table des matières

1. [Technologies utilisées](#technologies)
2. [Analyse du Back-end](#backend)
3. [Analyse du Front-end](#frontend)
4. [Interactions Front ↔ Back](#interactions)
5. [Axes d'amélioration](#ameliorations)

---

## 1. Technologies utilisées

### Back-end

| Technologie | Version | Rôle dans le projet |
|---|---|---|
| **NestJS** | `^10.x` | Framework Node.js structuré en modules. Fournit l'IoC (Injection de dépendances), les guards, les décorateurs et l'organisation par domaines métier. |
| **MongoDB** | `7.x` (Docker) | Base de données NoSQL orientée documents. Stocke les activités et les utilisateurs sous forme de documents BSON. |
| **Mongoose** | `^7.3.4` | ODM (Object Document Mapper) pour MongoDB. Définit les schémas, valide les données et expose des méthodes de requêtage (`.find()`, `.populate()`, etc.). |
| **GraphQL + Apollo Server** | `^16.8.1` / `^4.x` | Protocole et moteur d'API. Remplace le REST traditionnel en exposant un seul endpoint `/graphql` avec un schéma typé auto-généré (`autoSchemaFile`). |
| **JWT (jsonwebtoken)** | via `@nestjs/jwt` | Gestion de l'authentification stateless. Le token est généré à la connexion et vérifié à chaque requête dans le contexte GraphQL global. |
| **bcrypt** | via `bcryptjs` | Hashage sécurisé des mots de passe avant stockage en base (salt factor 10). |
| **class-validator** | `^0.14.x` | Validation déclarative des DTOs d'entrée GraphQL via des décorateurs (`@IsNotEmpty`, `@IsNumber`, `@Min`). |
| **ConfigModule** | `@nestjs/config` | Centralise la gestion des variables d'environnement (`.env`) avec injection typée dans les services. |

### Front-end

| Technologie | Version | Rôle dans le projet |
|---|---|---|
| **Next.js** | `13.4.10` (Page Router) | Framework React SSR/SSG. Gère le routing par fichiers, le rendu côté serveur (`getServerSideProps`) et l'optimisation des performances. |
| **React** | `18.2.0` | Bibliothèque UI de base. Utilisé avec les hooks (`useState`, `useContext`, `useEffect`) et les contextes pour la gestion d'état global. |
| **Apollo Client** | `^3.8.8` | Client GraphQL côté frontend. Gère les requêtes (queries/mutations), le cache normalisé et l'envoi du token JWT dans les headers. |
| **Mantine UI** | `^6.0.16` | Bibliothèque de composants React (Card, Badge, Flex, Paper, Avatar…). Fournit le design system de l'application. |
| **GraphQL Code Generator** | `^5.0.0` | Génère automatiquement les types TypeScript depuis le `schema.gql` backend. Garantit la cohérence des types entre front et back. |
| **Vitest** | `^0.33.0` | Framework de tests unitaires (alternative à Jest, compatible Vite). Utilisé pour les tests de composants avec `@testing-library/react`. |
| **Axios** | `^1.4.0` | Client HTTP déclaré comme dépendance mais sous-utilisé — Apollo Client gère l'intégralité des requêtes GraphQL. |

---

## 2. Analyse du Back-end

### Structure des modules

```
back-end/src/
├── activity/          # Module Activité (resolver, service, schema, dto)
├── auth/              # Module Auth (service, guard, types)
├── me/
│   └── resolver/      # Resolver dédié à l'utilisateur connecté (getMe)
├── seed/              # Initialisation des données de test
├── user/              # Module Utilisateur (service, schema)
├── test/              # Utilitaires de test (MongoMemoryServer)
└── app.module.ts      # Module racine
```

L'organisation suit globalement la **feature-based architecture** de NestJS : chaque domaine métier (activité, auth, utilisateur) est encapsulé dans son propre module avec ses dépendances déclarées explicitement.

---

### Bonnes pratiques identifiées

#### ✅ Séparation des responsabilités (Single Responsibility)
Chaque classe a un périmètre clair :
- `ActivityResolver` → point d'entrée GraphQL, délègue au service
- `ActivityService` → logique métier et accès MongoDB
- `ActivitySchema` → définition de la structure de données

#### ✅ Pattern Data Mapper
Le schéma Mongoose (`@Schema`) et le type GraphQL (`@ObjectType`) sont fusionnés dans la même classe via les décorateurs NestJS. Cela évite la duplication tout en maintenant une séparation logique entre la couche de persistance et la couche API.

#### ✅ Authentification centralisée dans le contexte GraphQL
Le décodage du JWT est effectué **une seule fois** dans `app.module.ts`, avant d'atteindre n'importe quel resolver. Le `jwtPayload` est injecté dans le contexte GraphQL global.

#### ✅ Guard réutilisable
`AuthGuard` est un guard NestJS standard, applicable sur n'importe quel resolver ou mutation via `@UseGuards(AuthGuard)`. Il ne contient que la logique de vérification de présence du payload :

#### ✅ Validation des inputs avec class-validator
Les DTOs d'entrée GraphQL utilisent des décorateurs de validation déclaratifs :

```typescript
// activity.inputs.dto.ts
@InputType()
export class CreateActivityInput {
  @IsNotEmpty() @Field() name!: string;
  @IsNotEmpty() @Field() city!: string;
  @IsNumber() @Min(0) @Field(() => Int) price!: number;
}
```

#### ✅ Seed automatique au démarrage
`SeedService` initialise les données de test (utilisateur + admin + activités) si la base est vide. Cela facilite l'onboarding des développeurs sans étape manuelle supplémentaire.

#### ✅ Tests avec MongoDB en mémoire
`test.module.ts` utilise `mongodb-memory-server` pour instancier une base MongoDB en RAM pendant les tests. Aucune connexion externe requise pour `npm run test`.

---

### Faiblesses identifiées

_#### ❌ `UnauthorizedException` lancée pour les routes publiques
Dans `app.module.ts`, si un token invalide (expiré, malformé) est envoyé avec une requête vers une query **publique**, une exception est levée immédiatement dans le contexte, avant même d'atteindre le resolver :_
(Corrigé commit f510f76a3061e6a9ba55e54af45a4fb979db2999)

#### ❌ `password` exposé dans le schéma GraphQL
Le champ `password` est annoté `@Field()` et retourné dans `getMe`. N'importe quel client peut récupérer le hash bcrypt du mot de passe.
(Corrigé commit cf66f4b1f1ede298d6ab5dc7854f14ab819310fb)

#### ❌ Architecture double module sans justification claire
`app.module.ts` contient deux classes (`BaseAppModule` et `AppModule`) dans le même fichier. La séparation entre la configuration GraphQL/Auth et la connexion Mongoose n'apporte pas de bénéfice architectural visible.

#### ❌ `SeedService` enregistré deux fois
`SeedService` est déclaré dans `SeedModule` ET directement dans les `providers` de `BaseAppModule`. Cette redondance peut causer deux instanciations ou un comportement imprévisible.

#### ❌ Absence de pagination
`activityService.findAll()` retourne toutes les activités sans limite. À l'échelle, cette query peut saturer la mémoire et le réseau.

#### ❌ Problème N+1 sur le champ `owner`
`@ResolveField owner()` appelle `activity.populate('owner')` pour chaque activité retournée individuellement. Pour 100 activités, cela génère 100 requêtes MongoDB supplémentaires.

#### ❌ Token JWT stocké en base mais jamais vérifié
`user.token` est sauvegardé en base lors de la connexion, mais n'est jamais comparé lors de l'authentification. Ce mécanisme est donc inopérant : aucune révocation de token n'est possible.

---

## 3. Analyse du Front-end

### Structure des pages et composants

```
front-end/src/
├── components/
│   ├── Activity.tsx           # Carte activité (grille)
│   ├── ActivityListItem.tsx   # Item activité (liste)
│   ├── PageTitle/             # Titre de page (avec sous-dossier)
│   └── ...
├── contexts/
│   ├── authContext.tsx        # État utilisateur connecté global
│   └── snackbarContext.tsx    # Notifications globales
├── graphql/
│   ├── apollo.ts              # Configuration Apollo Client
│   ├── fragments/             # Fragments GraphQL réutilisables
│   ├── mutations/             # Mutations GraphQL
│   ├── queries/               # Queries GraphQL
│   └── generated/             # Types auto-générés (codegen)
├── hocs/
│   ├── withAuth.tsx           # Protect routes → redirige vers /signin
│   └── withoutAuth.tsx        # Redirige les connectés hors signin/signup
├── pages/
│   ├── index.tsx              # Accueil (dernières activités)
│   ├── discover.tsx           # Toutes les activités
│   ├── explorer/              # Navigation par ville
│   ├── activities/            # Détail d'une activité
│   ├── my-activities.tsx      # Activités de l'utilisateur connecté
│   ├── profil.tsx             # Profil utilisateur
│   ├── signin.tsx / signup.tsx
│   └── _app.tsx               # Layout global + providers
└── routes.ts                  # Définition centralisée des routes
```

---

### Bonnes pratiques identifiées

#### ✅ Contextes React bien séparés
`AuthContext` et `SnackbarContext` sont deux contextes indépendants aux responsabilités distinctes. `AuthContext` expose `user`, `signin`, `signup`, `logout`. `SnackbarContext` expose `showSnackbar`. Ils sont composés dans `_app.tsx`.

#### ✅ HOCs de protection de routes
Deux Higher Order Components assurent la protection des pages :
- `withAuth` : redirige vers `/signin` si non connecté (avec état de chargement)
- `withoutAuth` : redirige vers `/` si déjà connecté (évite l'accès à `/signin` en étant connecté)

#### ✅ Fragments GraphQL réutilisables
Les fragments `ActivityFragment` et `OwnerFragment` centralisent la définition des champs demandés, évitant la duplication dans chaque query/mutation.

#### ✅ Génération automatique des types TypeScript
La commande `npm run generate-types` copie le `schema.gql` du backend et génère les types TypeScript via GraphQL Code Generator. Les types de queries et mutations sont utilisés partout dans les pages, garantissant la cohérence front/back au niveau du typage.

#### ✅ Routes centralisées
`routes.ts` définit un tableau de routes avec label, path, et flags (`requireAuth`, `hideWhenAuth`). Le header et les HOCs s'appuient sur cette source unique de vérité.

#### ✅ `getServerSideProps` pour le pré-rendu SSR
Les pages publiques (accueil, découverte, explorateur) utilisent `getServerSideProps` pour récupérer les données côté serveur via `graphqlClient`. Cela améliore le SEO et la performance perçue (page déjà peuplée à l'arrivée).

#### ✅ Hooks personnalisés
`useAuth()` et `useSnackbar()` encapsulent l'accès aux contextes avec vérification de nullité, offrant une API propre aux composants consommateurs.

---

### Faiblesses identifiées

#### ❌ Token JWT stocké dans `localStorage`
Le `localStorage` est accessible depuis n'importe quel script JavaScript de la page, ce qui expose le token aux attaques XSS. Un cookie `httpOnly` serait inaccessible au JavaScript et donc bien plus sûr.

#### ❌ Deux clients Apollo sans cache partagé
- `graphqlClient` dans `apollo.ts` : client statique utilisé dans `getServerSideProps` (SSR)
- `ApolloProvider` dans `_app.tsx` : client côté navigateur

Ces deux instances ont des caches séparés. Une donnée récupérée en SSR n'est pas présente dans le cache client. Cela peut provoquer des doubles requêtes et des incohérences d'affichage.

#### ❌ Organisation des composants incohérente
Certains composants ont un sous-dossier (`PageTitle/PageTitle.tsx`), d'autres sont à la racine de `components/` (`Activity.tsx`, `ActivityListItem.tsx`). L'absence de convention uniforme complique la navigation dans le code.

#### ❌ Interface City manquant et recherche geo.api.gouv
L'interface City, pourtant utilisée, est manquante. De plus, elle semble être importée de Utils, ce qui n'est pas sa place
L'utilisation de geo.api.gouv.fr crée un risque sur de blocage sur la recherche (quota assez bas)
---

## 4. Interactions Front ↔ Back

### Vue d'ensemble du flux applicatif

```
Navigateur (Next.js)
       │
       │  HTTP POST /graphql (JSON body)
       │  Header: jwt: <token>
       ▼
NestJS + Apollo Server (:3000)
       │
       ├─ Context GraphQL → décode JWT → injecte jwtPayload
       │
       ├─ Resolver (Query/Mutation)
       │     └─ @UseGuards(AuthGuard) → vérifie jwtPayload
       │
       └─ Service → Mongoose → MongoDB (:27017)
```

### Authentification — flux complet

```
1. Frontend → mutation login(email, password)
2. Backend AuthService.signIn()
   ├─ findOne(email) → MongoDB
   ├─ bcrypt.compare(password, hash)
   └─ jwtService.sign({ id, email }) → access_token
3. Frontend reçoit { access_token }
   ├─ localStorage.setItem('token', access_token)
   ├─ query getMe() avec header jwt: <token>
   └─ AuthContext.user = payload getMe
4. Requêtes suivantes : header jwt: <token> sur chaque requête Apollo
5. Backend context() → jwtService.verifyAsync(token) → jwtPayload dans contexte
```

### Récupération des activités — SSR vs Client

**Mode SSR (`getServerSideProps`) :**
```
Next.js Server → graphqlClient.query(GetActivities)
              → POST /graphql (sans token, query publique)
              → ActivityResolver.getActivities()
              → ActivityService.findAll() → MongoDB
              → Page HTML pré-rendue envoyée au navigateur
```

**Mode Client (Apollo Provider) :**
```
Composant React → useQuery(GetActivitiesByUser)
               → Apollo Client → POST /graphql (avec header jwt)
               → AuthGuard vérifie jwtPayload
               → ActivityService.findByUser(userId) → MongoDB
               → Données dans le cache Apollo Client
```

### Schéma de l'API GraphQL (points d'entrée principaux)

| Opération | Type | Auth requise | Description |
|---|---|---|---|
| `getActivities` | Query | ❌ | Toutes les activités |
| `getLatestActivities` | Query | ❌ | Dernières activités |
| `getActivitiesByCity` | Query | ❌ | Filtrage par ville + type + prix |
| `getCities` | Query | ❌ | Liste des villes disponibles |
| `getActivity(id)` | Query | ❌ | Détail d'une activité |
| `getActivitiesByUser` | Query | ✅ | Activités de l'utilisateur connecté |
| `createActivity` | Mutation | ✅ | Créer une activité |
| `login` | Mutation | ❌ | Connexion → retourne `access_token` |
| `register` | Mutation | ❌ | Inscription |
| `getMe` | Query | ✅ | Profil de l'utilisateur connecté |

### Cycle de vie d'une page protégée (`my-activities.tsx`)

```
1. Utilisateur visite /my-activities
2. withAuth HOC → vérifie AuthContext.user
   ├─ user null + loading → <Loader />
   ├─ user null → router.push('/signin')
   └─ user présent → render MyActivities
3. getServerSideProps → graphqlClient.query(GetActivitiesByUser)
   └─ ⚠️ Sans token en SSR → query protégée → échec potentiel
4. Page rendue avec les données
```

> ⚠️ **Problème identifié** : `getActivitiesByUser` requiert une authentification, mais `getServerSideProps` utilise le client statique `graphqlClient` sans transmettre le cookie/header JWT du navigateur. Cette query devrait être effectuée côté client (via `useQuery`) ou le token devrait être transmis depuis le cookie de la requête SSR.

---

## 5. Axes d'amélioration

### 🟠 Priorité haute

#### Remplacer le stockage JWT (localStorage → cookie httpOnly)
```typescript
// Backend : retourner le token dans un cookie httpOnly
res.cookie('jwt', access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
});
```

#### Ajouter la pagination
```typescript
// activity.service.ts
findAll(page = 1, limit = 20): Promise<Activity[]> {
  return this.activityModel
    .find()
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();
}
```

#### Résoudre le problème N+1 avec DataLoader
Implémenter un `UserDataLoader` (via `nestjs-dataloader`) qui regroupe les requêtes `populate('owner')` en une seule requête MongoDB par batch :
```typescript
const users = await this.userModel.find({ _id: { $in: ownerIds } });
```

#### Correction de l'interface City et architecture des types
L'interface `City` est actuellement manquante dans le code source, ce qui casse la compilation TypeScript, et son import depuis `utils` ne respecte pas les bonnes pratiques.

---

### 🟡 Priorité modérée

#### Unifier les deux clients Apollo
Passer le token depuis l'état SSR vers le cache Apollo Client initial (via `initialState` dans `_app.tsx`) pour éviter les doubles requêtes :
```typescript
// _app.tsx
const client = initializeApollo(pageProps.initialApolloState);
```

#### Supprimer les dépendances inutiles
- `@apollo/gateway` : inutilisé (pas de federation), ajoute une surface d'attaque
- `cookie-parser` : inutilisé, le JWT transite par header
- `class-transformer-validator` : abandonné depuis 2019, remplacer par `class-validator` + `class-transformer` directs

#### Mettre à jour les dépendances vulnérables
| Package | Version actuelle | Version cible | CVE |
|---|---|---|---|
| `mongoose` | `^7.3.4` | `^8.9.5+` | CVE-2024-53900, CVE-2025-23061 (RCE) |
| `axios` | `^1.4.0` | `^1.7.4+` | CVE-2024-39338 (SSRF) |

---

### 🔵 Améliorations de qualité

#### Uniformiser la structure des composants
Adopter une convention unique : soit tous les composants dans un sous-dossier `ComponentName/ComponentName.tsx` avec un `index.ts`, soit tous à plat. L'incohérence actuelle (certains avec sous-dossier, d'autres non) complique la navigation.

### Tableau de synthèse

| Problème | Priorité | Effort | Impact       |
|---|---|---|--------------|
| JWT en localStorage | 🟠 Haute | Moyen | Sécurité     |
| CVE mongoose + axios | 🟠 Haute | Faible | Sécurité     |
| Pagination absente | 🟠 Haute | Moyen | Performance  |
| Interface City manquante | 🟠 Haute | Faible | Maintenance  |
| Problème N+1 `owner` | 🟡 Modérée | Moyen | Performance  |
| Double client Apollo | 🟡 Modérée | Moyen | Cohérence    |
| Dépendances inutilisées | 🟡 Modérée | Faible | Maintenance  |
| Token JWT stocké en base inutilement | 🔵 Faible | Moyen | Architecture |
