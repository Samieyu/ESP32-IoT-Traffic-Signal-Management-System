import request from 'supertest';
import { app } from '../index.js';
import { dbStore } from '../repositories/store.js';

describe('Traffic System End-to-End API Tests (FR-1 to FR-11)', () => {
  let adminToken: string;
  let policeToken: string;
  let intersectionId: string;

  beforeAll(async () => {
    await dbStore.initSeed();

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 'admin', password: 'AdminPassword123!' });
    adminToken = adminLogin.body.data.accessToken;

    const policeLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 'officer_mesay', password: 'OfficerPassword123!' });
    policeToken = policeLogin.body.data.accessToken;

    intersectionId = 'int-wcu-0000-0000-000000000001';
  });

  describe('User & Officer Management (FR-1, FR-2)', () => {
    it('allows Admin to create a new Traffic Police account', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new.officer@traffic.wcu.edu.et',
          username: 'officer_test',
          password: 'Password123!',
          fullName: 'Officer Test Officer',
          role: 'TRAFFIC_POLICE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('officer_test');
    });

    it('rejects Traffic Police attempting to access user creation (RBAC check)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${policeToken}`)
        .send({
          email: 'forbidden@traffic.wcu.edu.et',
          username: 'forbidden',
          password: 'Password123!',
          fullName: 'Forbidden',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });
  });

  describe('Signal Configuration Safety Interlocks (FR-4, NFR-14)', () => {
    it('rejects unsafe configuration with yellow duration below 3 seconds', async () => {
      const res = await request(app)
        .put(`/api/v1/intersections/${intersectionId}/configuration`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          northSouthGreenDuration: 30,
          eastWestGreenDuration: 30,
          yellowDuration: 2, // UNSAFE (< 3s)
          allRedClearanceDuration: 2,
          maxEmergencyPriorityDuration: 60,
          lcdEnabled: true,
          countdownDisplayEnabled: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('applies valid configuration and tracks version delivery', async () => {
      const res = await request(app)
        .put(`/api/v1/intersections/${intersectionId}/configuration`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          northSouthGreenDuration: 45,
          eastWestGreenDuration: 35,
          yellowDuration: 4,
          allRedClearanceDuration: 2,
          maxEmergencyPriorityDuration: 60,
          lcdEnabled: true,
          lcdDisplayMode: 'COUNTDOWN_AND_PHASE',
          lcdCustomMessage: 'WCU Highway Interlock Safe',
          countdownDisplayEnabled: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.configuration.northSouthGreenDuration).toBe(45);
    });
  });

  describe('Traffic Incident Recording (FR-6)', () => {
    it('allows assigned officer to record a traffic incident', async () => {
      const res = await request(app)
        .post('/api/v1/incidents')
        .set('Authorization', `Bearer ${policeToken}`)
        .send({
          intersectionId,
          incidentType: 'ROAD_ACCIDENT',
          severity: 'HIGH',
          incidentTimestamp: new Date().toISOString(),
          description: 'Two vehicles collided during morning rush hour near pedestrian lane.',
          additionalNotes: 'Emergency medical unit dispatched.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referenceId).toMatch(/^INC-\d{8}-\d{4}$/);
    });
  });

  describe('Traffic Problem Reporting (FR-7)', () => {
    it('allows officer to report a traffic violation with vehicle license plate', async () => {
      const res = await request(app)
        .post('/api/v1/traffic-problems')
        .set('Authorization', `Bearer ${policeToken}`)
        .send({
          intersectionId,
          category: 'TRAFFIC_VIOLATION',
          problemType: 'Reckless Driving',
          description: 'Minibus overtook queued vehicles on red light phase.',
          licensePlateNumber: 'ET-3-99999',
          urgency: 'HIGH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referenceId).toMatch(/^PRB-\d{8}-\d{4}$/);
    });
  });

  describe('Emergency Priority Management (FR-8, NFR-14)', () => {
    let operationId: string;

    it('requests emergency priority for assigned intersection', async () => {
      const res = await request(app)
        .post('/api/v1/emergency-priorities')
        .set('Authorization', `Bearer ${policeToken}`)
        .send({
          intersectionId,
          direction: 'NORTH',
          movement: 'STRAIGHT',
          durationSeconds: 45,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referenceId).toMatch(/^EMG-\d{8}-\d{4}$/);
      operationId = res.body.data.id;
    });

    it('terminates active emergency priority manually', async () => {
      const res = await request(app)
        .post(`/api/v1/emergency-priorities/${operationId}/terminate`)
        .set('Authorization', `Bearer ${policeToken}`)
        .send({
          reason: 'Ambulance cleared intersection safely.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  describe('Reporting & Exports (FR-5, FR-10)', () => {
    let reportId: string;

    it('generates an Incident report', async () => {
      const res = await request(app)
        .post('/api/v1/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportType: 'INCIDENTS',
          startDate: new Date('2026-01-01').toISOString(),
          endDate: new Date().toISOString(),
          exportFormat: 'PDF',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      reportId = res.body.data.id;
    });

    it('exports PDF report with correct headers', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/${reportId}/pdf`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('exports Excel report with correct headers', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/${reportId}/excel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });
  });
});
