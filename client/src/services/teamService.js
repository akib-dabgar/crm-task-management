import api from './api';

export const teamService = {
  async listTeams() {
    const response = await api.get('/teams');
    return response.data;
  },

  async getTeamById(id) {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  async createTeam(teamData) {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  async updateTeam(id, teamData) {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  async deleteTeam(id) {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  }
};

export default teamService;
