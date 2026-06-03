import request from 'supertest';
// Note: In a real setup, you'd export 'app' from server.js without starting the listener
// For this example, I'm showing the structure of a senior-level integration test.

/**
 * ARCHITECTURE TIP: 
 * Senior devs use 'Arrange-Act-Assert' pattern.
 */

describe('GET /api/v1/cli-tools', () => {
  
  it('should return 200 and a list of active tools', async () => {
    // 1. Arrange (Optional: Seed test DB)
    
    // 2. Act
    // const response = await request(app).get('/api/v1/cli-tools');

    // 3. Assert
    // expect(response.status).toBe(200);
    // expect(response.body.status).toBe('success');
    // expect(Array.isArray(response.body.data.tools)).toBe(true);
  });

  it('should filter tools by category', async () => {
    // Act
    // const response = await request(app).get('/api/v1/cli-tools?category=devops');
    
    // Assert
    // expect(response.body.data.tools.every(t => t.category.slug === 'devops')).toBe(true);
  });
});

/**
 * WHY TEST LIKE THIS?
 * 1. Refactor Confidence: You can change your DB logic, and if the tests pass, the API contract is still valid.
 * 2. Documentation: Tests are the most up-to-date documentation of how your API works.
 */
