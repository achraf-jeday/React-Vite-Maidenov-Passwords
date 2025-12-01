// Real API service for Drupal 11 JSON:API integration
export const api = {
  async getUsers(page = 1, pageSize = 10, search = '', sortBy = [{ id: 'id', desc: false }]) {
    const token = localStorage.getItem('maidenov_access_token');

    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams({
      'page[limit]': pageSize,
      'page[offset]': offset
    });

    if (search) {
      params.append('filter[name][condition][path]', 'name');
      params.append('filter[name][condition][operator]', 'CONTAINS');
      params.append('filter[name][condition][value]', search);
    }

    // Add sorting - default to name ascending if no sort specified
    const sortColumn = sortBy && sortBy.length > 0 ? sortBy[0].id : 'name';
    const sortDirection = sortBy && sortBy.length > 0 && sortBy[0].desc ? '-' : '';
    params.append('sort', `${sortDirection}${sortColumn}`);

    const headers = {
      'Accept': 'application/vnd.api+json'
    };

    // Add authentication if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/jsonapi/user_confidential_data/type_1?${params}`,
        {
          headers
        }
      );

      if (!response.ok) {
        // If unauthorized, clear the token and retry without auth
        if (response.status === 401 && token) {
          localStorage.removeItem('maidenov_access_token');
          delete headers['Authorization'];

          // Retry without authentication
          const retryResponse = await fetch(
            `http://localhost:8080/jsonapi/user_confidential_data/type_1?${params}`,
            {
              headers
            }
          );

          if (!retryResponse.ok) {
            throw new Error(`Failed to fetch users: ${retryResponse.status}`);
          }

          const data = await retryResponse.json();
          const users = data.data.map(item => ({
            id: item.id,
            name: item.attributes.name,
            role: item.attributes.role || 'User',
            status: item.attributes.status ? 'Active' : 'Inactive',
            department: item.attributes.department || 'General',
            lastLogin: item.attributes.last_login ? new Date(item.attributes.last_login).toLocaleDateString() : 'Never',
            created: item.attributes.created ? new Date(item.attributes.created).toLocaleDateString() : 'Unknown',
            changed: item.attributes.changed ? new Date(item.attributes.changed).toLocaleDateString() : 'Unknown',
            user: item.relationships?.user?.data?.id
          }));

          return {
            data: users,
            total: data.meta?.pagination?.total || 51,
            totalPages: data.meta?.pagination?.total_pages || Math.ceil(51 / pageSize),
            currentPage: page
          };
        } else {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
      }

      const data = await response.json();

      const users = data.data.map(item => ({
        id: item.id,
        name: item.attributes.name,
        role: item.attributes.role || 'User',
        status: item.attributes.status ? 'Active' : 'Inactive',
        department: item.attributes.department || 'General',
        lastLogin: item.attributes.last_login ? new Date(item.attributes.last_login).toLocaleDateString() : 'Never',
        created: item.attributes.created ? new Date(item.attributes.created).toLocaleDateString() : 'Unknown',
        changed: item.attributes.changed ? new Date(item.attributes.changed).toLocaleDateString() : 'Unknown',
        user: item.relationships?.user?.data?.id
      }));

      return {
        data: users,
        total: data.meta?.pagination?.total || 51,
        totalPages: data.meta?.pagination?.total_pages || Math.ceil(51 / pageSize),
        currentPage: page
      };
    } catch (error) {
      // If fetch fails completely, try without authentication
      if (token) {
        localStorage.removeItem('maidenov_access_token');
        delete headers['Authorization'];

        const fallbackResponse = await fetch(
          `http://localhost:8080/jsonapi/user_confidential_data/type_1?${params}`,
          {
            headers
          }
        );

        if (!fallbackResponse.ok) {
          throw new Error(`Failed to fetch users: ${fallbackResponse.status}`);
        }

        const data = await fallbackResponse.json();
        const users = data.data.map(item => ({
          id: item.id,
          name: item.attributes.name,
          role: item.attributes.role || 'User',
          status: item.attributes.status ? 'Active' : 'Inactive',
          department: item.attributes.department || 'General',
          lastLogin: item.attributes.last_login ? new Date(item.attributes.last_login).toLocaleDateString() : 'Never',
          created: item.attributes.created ? new Date(item.attributes.created).toLocaleDateString() : 'Unknown',
          changed: item.attributes.changed ? new Date(item.attributes.changed).toLocaleDateString() : 'Unknown',
          user: item.relationships?.user?.data?.id
        }));

        return {
          data: users,
          total: data.meta?.pagination?.total || 51,
          totalPages: data.meta?.pagination?.total_pages || Math.ceil(51 / pageSize),
          currentPage: page
        };
      }

      throw error;
    }
  },

  async deleteUser(id) {
    const token = localStorage.getItem('maidenov_access_token');

    const response = await fetch(
      `http://localhost:8080/jsonapi/user_confidential_data/type_1/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }

    return { success: true };
  },

  async updateUser(id, data) {
    const token = localStorage.getItem('maidenov_access_token');

    const requestBody = {
      data: {
        type: 'user_confidential_data--type_1',
        id: id,
        attributes: {
          name: data.name,
          role: data.role,
          status: data.status === 'Active',
          department: data.department
        }
      }
    };

    const response = await fetch(
      `http://localhost:8080/jsonapi/user_confidential_data/type_1/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: {
        id: result.data.id,
        name: result.data.attributes.name,
        role: result.data.attributes.role,
        status: result.data.attributes.status ? 'Active' : 'Inactive',
        department: result.data.attributes.department,
        lastLogin: result.data.attributes.last_login ? new Date(result.data.attributes.last_login).toLocaleDateString() : 'Never',
        created: result.data.attributes.created ? new Date(result.data.attributes.created).toLocaleDateString() : 'Unknown',
        changed: result.data.attributes.changed ? new Date(result.data.attributes.changed).toLocaleDateString() : 'Unknown'
      }
    };
  }
};

// Mock API service for demo purposes (kept as fallback)
export const mockAPI = {
  async getUsers(page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc') {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate mock data
    const total = 127;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit - 1, total - 1);

    const users = [];
    for (let i = startIndex; i <= endIndex; i++) {
      users.push({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: ['Admin', 'Editor', 'Viewer'][i % 3],
        status: i % 4 === 0 ? 'Inactive' : 'Active',
        lastLogin: new Date(Date.now() - Math.random() * 1000000000).toLocaleDateString(),
        department: ['Engineering', 'Marketing', 'Sales', 'HR'][i % 4],
        createdAt: new Date(Date.now() - Math.random() * 2000000000).toLocaleDateString(),
        avatar: `https://i.pravatar.cc/40?img=${(i % 70) + 1}`,
        permissions: ['Read', 'Write', 'Delete'].slice(0, Math.floor(Math.random() * 3) + 1)
      });
    }

    return {
      data: users,
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  },

  async deleteUser(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  async updateUser(id, data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, ...data };
  }
};