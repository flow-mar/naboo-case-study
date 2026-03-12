import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { BaseAppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestModule, closeInMongodConnection } from './test/test.module';
import { UserService } from './user/user.service';
import { AuthService } from './auth/auth.service';
import { ActivityService } from './activity/activity.service';

describe('Functional E2E', () => {
  let app: INestApplication;
  let userService: UserService;
  let authService: AuthService;
  let activityService: ActivityService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, BaseAppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    activityService = module.get<ActivityService>(ActivityService);
  });

  afterAll(async () => {
    await app.close();
    await closeInMongodConnection();
  });

  async function getJwtForUser(email: string, role: 'user' | 'admin' = 'user') {
    const password = 'Password123!';
    const user = await userService.createUser({
      email,
      password,
      firstName: 'Test',
      lastName: role.toUpperCase(),
      role,
    });
    return authService.generateToken({ user });
  }

  it('should create an activity, check visibility of createdAt (user vs admin), and favorite it', async () => {
    const userJwt = await getJwtForUser(`${randomUUID()}@user.com`, 'user');
    const adminJwt = await getJwtForUser(`${randomUUID()}@admin.com`, 'admin');

    // 1. Create an activity as a user
    const createActivityMutation = `
      mutation {
        createActivity(createActivityInput: {
          name: "Nouvelle Activité",
          city: "Paris",
          price: 50,
          description: "Une super description"
        }) {
          id
          name
        }
      }
    `;

    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('jwt', userJwt)
      .send({ query: createActivityMutation })
      .expect(200);

    const activityId = createResponse.body.data.createActivity.id;
    expect(activityId).toBeDefined();
    expect(createResponse.body.data.createActivity.name).toBe(
      'Nouvelle Activité',
    );

    // 2. Get list of activities as a user (createdAt should be null)
    const getActivitiesQuery = `
      query {
        getActivities {
          id
          name
          createdAt
        }
      }
    `;

    const userListResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('jwt', userJwt)
      .send({ query: getActivitiesQuery })
      .expect(200);

    const userActivity = userListResponse.body.data.getActivities.find(
      (a: any) => a.id === activityId,
    );
    expect(userActivity).toBeDefined();
    expect(userActivity.createdAt).toBeNull();

    // 3. Get list of activities as an admin (createdAt should NOT be null)
    const adminListResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('jwt', adminJwt)
      .send({ query: getActivitiesQuery })
      .expect(200);

    const adminActivity = adminListResponse.body.data.getActivities.find(
      (a: any) => a.id === activityId,
    );
    expect(adminActivity).toBeDefined();
    expect(adminActivity.createdAt).not.toBeNull();
    expect(new Date(adminActivity.createdAt).getTime()).toBeGreaterThan(0);

    // 4. Favorite the activity as a user
    const addFavoriteMutation = `
      mutation {
        addFavorite(activityId: "${activityId}") {
          activityId
          isFavorite
          favoritesCount
        }
      }
    `;

    const favoriteResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('jwt', userJwt)
      .send({ query: addFavoriteMutation })
      .expect(200);

    expect(favoriteResponse.body.data.addFavorite).toMatchObject({
      activityId,
      isFavorite: true,
      favoritesCount: 1,
    });

    const getMeWithFavoritesQuery = `
      query {
        getMe {
          id
          favorites(first: 10) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `;

    const getMeResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('jwt', userJwt)
      .send({ query: getMeWithFavoritesQuery })
      .expect(200);

    const edges = getMeResponse.body.data.getMe.favorites.edges;
    expect(edges.some((e: any) => e.node.id === activityId)).toBe(true);
  });

  it('should refuse adding a 51st favorite', async () => {
    const password = 'Password123!';
    const user = await userService.createUser({
      email: `${randomUUID()}@user.com`,
      password,
      firstName: 'Test',
      lastName: 'USER',
      role: 'user',
    });

    const userJwt = await authService.generateToken({ user });

    const activityIds: string[] = [];
    for (let i = 0; i < 51; i += 1) {
      const activity = await activityService.create(user.id, {
        name: `Fav ${i}`,
        city: 'Paris',
        price: 10,
        description: 'Desc',
      });
      activityIds.push(activity._id.toString());
    }

    for (let i = 0; i < 50; i += 1) {
      const mutation = `
        mutation {
          addFavorite(activityId: "${activityIds[i]}") {
            favoritesCount
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('jwt', userJwt)
        .send({ query: mutation })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.addFavorite.favoritesCount).toBe(i + 1);
    }

    const exceedMutation = `
      mutation {
        addFavorite(activityId: "${activityIds[50]}") {
          favoritesCount
        }
      }
    `;

    const exceedRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('jwt', userJwt)
      .send({ query: exceedMutation })
      .expect(200);

    expect(exceedRes.body.data?.addFavorite ?? null).toBeNull();
    expect(exceedRes.body.errors?.[0]?.message).toContain(
      'Favorites limit reached',
    );

    const idempotentMutation = `
      mutation {
        addFavorite(activityId: "${activityIds[0]}") {
          favoritesCount
        }
      }
    `;

    const idempotentRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('jwt', userJwt)
      .send({ query: idempotentMutation })
      .expect(200);

    expect(idempotentRes.body.errors).toBeUndefined();
    expect(idempotentRes.body.data.addFavorite.favoritesCount).toBe(50);
  });
});
