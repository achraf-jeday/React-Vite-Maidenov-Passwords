// Real API service for Drupal 11 JSON:API integration
import { refreshAccessToken, ensureFreshToken } from './authService';

export const api = {
  async getUsers(page = 1, pageSize = 10, search = '', sortBy = [{ id: 'id', desc: false }]) {
    // Ensure token is fresh before making request
    await ensureFreshToken();

    const token = localStorage.getItem('maidenov_access_token');

    // API limits to 50 records max per request
    const apiLimit = 50;
    const allData = [];
    let totalRecords = 0;

    // Calculate how many API pages we need to fetch
    let totalPagesNeeded;
    let apiPage;
    let offset;
    let effectiveLimit;

    if (pageSize <= apiLimit) {
      // For pageSize <= 50, we just need one API call
      totalPagesNeeded = 1;
      apiPage = page;
      offset = (page - 1) * pageSize;
      effectiveLimit = pageSize; // Use the requested pageSize, not the API limit
    } else {
      // For pageSize > 50, we need multiple API calls
      totalPagesNeeded = Math.ceil(pageSize / apiLimit);
      apiPage = (page - 1) * totalPagesNeeded + 1; // Start from the first API page for this frontend page
      offset = (apiPage - 1) * apiLimit;
      effectiveLimit = apiLimit; // Use the API limit for each call
    }

    // Fetch the required API pages
    for (let i = 0; i < totalPagesNeeded; i++) {
      const currentApiPage = apiPage + i;

      // Calculate the correct offset based on pageSize vs apiLimit
      let currentOffset;
      if (pageSize <= apiLimit) {
        // For pageSize <= 50, use the calculated offset directly
        currentOffset = offset;
      } else {
        // For pageSize > 50, calculate offset for each API page
        currentOffset = (currentApiPage - 1) * apiLimit;
      }

      const params = new URLSearchParams({
        'page[limit]': effectiveLimit,
        'page[offset]': currentOffset
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
          `/jsonapi/user_confidential_data/type_1?${params}`,
          {
            headers
          }
        );

        if (!response.ok) {
          // If unauthorized, try to refresh the token first
          if (response.status === 401 && token) {
            try {
              // Attempt to refresh the token
              await refreshAccessToken();
              const newToken = localStorage.getItem('maidenov_access_token');

              if (newToken) {
                // Retry with the new token
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(
                  `/jsonapi/user_confidential_data/type_1?${params}`,
                  {
                    headers
                  }
                );

                if (!retryResponse.ok) {
                  throw new Error(`Failed to fetch users after token refresh: ${retryResponse.status}`);
                }

                const data = await retryResponse.json();
                const users = data.data.map(item => ({
                  id: item.id,
                  name: item.attributes.name,
                  email: item.attributes.email,
                  username: item.attributes.username,
                  password: item.attributes.password,
                  link: item.attributes.link,
                  notes: item.attributes.notes,
                  lastLogin: item.attributes.last_login ? new Date(item.attributes.last_login).toLocaleDateString() : 'Never',
                  created: item.attributes.created ? new Date(item.attributes.created).toLocaleDateString() : 'Unknown',
                  changed: item.attributes.changed ? new Date(item.attributes.changed).toLocaleDateString() : 'Unknown',
                  user: item.relationships?.user?.data?.id
                }));

                allData.push(...users);
                totalRecords = data.meta?.count || Object.keys(data.meta?.omitted?.links || {}).length;
              } else {
                // No new token available, clear the old one and retry without auth
                localStorage.removeItem('maidenov_access_token');
                delete headers['Authorization'];

                const retryResponse = await fetch(
                  `/jsonapi/user_confidential_data/type_1?${params}`,
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
                  email: item.attributes.email,
                  username: item.attributes.username,
                  password: item.attributes.password,
                  link: item.attributes.link,
                  notes: item.attributes.notes,
                  lastLogin: item.attributes.last_login ? new Date(item.attributes.last_login).toLocaleDateString() : 'Never',
                  created: item.attributes.created ? new Date(item.attributes.created).toLocaleDateString() : 'Unknown',
                  changed: item.attributes.changed ? new Date(item.attributes.changed).toLocaleDateString() : 'Unknown',
                  user: item.relationships?.user?.data?.id
                }));

                allData.push(...users);
                totalRecords = data.meta?.count || Object.keys(data.meta?.omitted?.links || {}).length;
              }
            } catch (refreshError) {
              // Refresh failed, clear token and retry without auth
              localStorage.removeItem('maidenov_access_token');
              delete headers['Authorization'];

              const retryResponse = await fetch(
                `/jsonapi/user_confidential_data/type_1?${params}`,
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

              allData.push(...users);
              totalRecords = data.meta?.count || Object.keys(data.meta?.omitted?.links || {}).length;
            }
          } else {
            throw new Error(`Failed to fetch users: ${response.status}`);
          }
        } else {
          const data = await response.json();

          const users = data.data.map(item => ({
            id: item.id,
            name: item.attributes.name,
            email: item.attributes.email,
            username: item.attributes.username,
            password: item.attributes.password,
            link: item.attributes.link,
            notes: item.attributes.notes,
            role: item.attributes.role || 'User',
            status: item.attributes.status ? 'Active' : 'Inactive',
            department: item.attributes.department || 'General',
            lastLogin: item.attributes.last_login ? new Date(item.attributes.last_login).toLocaleDateString() : 'Never',
            created: item.attributes.created ? new Date(item.attributes.created).toLocaleDateString() : 'Unknown',
            changed: item.attributes.changed ? new Date(item.attributes.changed).toLocaleDateString() : 'Unknown',
            user: item.relationships?.user?.data?.id
          }));

          allData.push(...users);

          // Handle different response structures for totalRecords:
          // - Searching encrypted fields: meta.count might be an array of IDs
          // - Normal queries: meta.count is an integer
          const metaCount = data.meta?.count;
          if (Array.isArray(metaCount)) {
            // Encrypted field search returns array of matching IDs
            totalRecords = metaCount.length;
          } else if (typeof metaCount === 'number') {
            // Normal query returns integer count
            totalRecords = metaCount;
          } else {
            // Fallback to data length
            totalRecords = data.data?.length || 0;
          }
        }
      } catch (error) {
        // If fetch fails completely, try without authentication
        if (token) {
          localStorage.removeItem('maidenov_access_token');
          delete headers['Authorization'];

          const fallbackResponse = await fetch(
            `/jsonapi/user_confidential_data/type_1?${params}`,
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
            email: item.attributes.email,
            username: item.attributes.username,
            password: item.attributes.password,
            link: item.attributes.link,
            notes: item.attributes.notes,
            role: item.attributes.role || 'User',
            status: item.attributes.status ? 'Active' : 'Inactive',
            department: item.attributes.department || 'General',
            lastLogin: item.attributes.last_login ? new Date(item.attributes.last_login).toLocaleDateString() : 'Never',
            created: item.attributes.created ? new Date(item.attributes.created).toLocaleDateString() : 'Unknown',
            changed: item.attributes.changed ? new Date(item.attributes.changed).toLocaleDateString() : 'Unknown',
            user: item.relationships?.user?.data?.id
          }));

          allData.push(...users);

          // Handle different response structures for totalRecords:
          // - Searching encrypted fields: meta.count might be an array of IDs
          // - Normal queries: meta.count is an integer
          const metaCount = data.meta?.count;
          if (Array.isArray(metaCount)) {
            // Encrypted field search returns array of matching IDs
            totalRecords = metaCount.length;
          } else if (typeof metaCount === 'number') {
            // Normal query returns integer count
            totalRecords = metaCount;
          } else {
            // Fallback to data length
            totalRecords = data.data?.length || 0;
          }
        } else {
          throw error;
        }
      }
    }

    // Return only the number of records requested by pageSize
    // Use totalRecords from API response (includes correct count for searches)
    return {
      data: allData.slice(0, pageSize),
      total: totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: page
    };
  },

  async deleteUser(id) {
    // Ensure token is fresh before making request
    await ensureFreshToken();

    const token = localStorage.getItem('maidenov_access_token');

    const response = await fetch(
      `/jsonapi/user_confidential_data/type_1/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      // Handle 401 errors by refreshing token
      if (response.status === 401 && token) {
        try {
          await refreshAccessToken();
          const newToken = localStorage.getItem('maidenov_access_token');

          if (newToken) {
            // Retry with new token
            const retryResponse = await fetch(
              `/jsonapi/user_confidential_data/type_1/${id}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${newToken}`
                }
              }
            );

            if (!retryResponse.ok) {
              throw new Error(`Failed to delete user after token refresh: ${retryResponse.status}`);
            }

            return { success: true };
          } else {
            throw new Error('Unable to refresh access token');
          }
        } catch (refreshError) {
          throw new Error(`Failed to delete user: ${response.status} (Token refresh failed)`);
        }
      } else {
        throw new Error(`Failed to delete user: ${response.status}`);
      }
    }

    return { success: true };
  },

  async updateUser(id, data) {
    // Ensure token is fresh before making request
    await ensureFreshToken();

    const token = localStorage.getItem('maidenov_access_token');

    const requestBody = {
      data: {
        type: 'user_confidential_data--type_1',
        id: id,
        attributes: {
          name: data.name,
          email: data.email || '',
          link: data.link || null,
          username: data.username || '',
          password: data.password || '',
          notes: data.notes || ''
        }
      }
    };

    const response = await fetch(
      `/jsonapi/user_confidential_data/type_1/${id}`,
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
      // Handle 401 errors by refreshing token
      if (response.status === 401 && token) {
        try {
          await refreshAccessToken();
          const newToken = localStorage.getItem('maidenov_access_token');

          if (newToken) {
            // Retry with new token
            const retryResponse = await fetch(
              `/jsonapi/user_confidential_data/type_1/${id}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/vnd.api+json',
                  'Authorization': `Bearer ${newToken}`
                },
                body: JSON.stringify(requestBody)
              }
            );

            if (!retryResponse.ok) {
              throw new Error(`Failed to update user after token refresh: ${retryResponse.status}`);
            }

            const result = await retryResponse.json();

            return {
              success: true,
              data: {
                id: result.data.id,
                name: result.data.attributes.name,
                email: result.data.attributes.email,
                username: result.data.attributes.username,
                password: result.data.attributes.password,
                link: result.data.attributes.link,
                notes: result.data.attributes.notes,
                lastLogin: result.data.attributes.last_login ? new Date(result.data.attributes.last_login).toLocaleDateString() : 'Never',
                created: result.data.attributes.created ? new Date(result.data.attributes.created).toLocaleDateString() : 'Unknown',
                changed: result.data.attributes.changed ? new Date(result.data.attributes.changed).toLocaleDateString() : 'Unknown'
              }
            };
          } else {
            throw new Error('Unable to refresh access token');
          }
        } catch (refreshError) {
          throw new Error(`Failed to update user: ${response.status} (Token refresh failed)`);
        }
      } else {
        throw new Error(`Failed to update user: ${response.status}`);
      }
    }

    const result = await response.json();

    return {
      success: true,
      data: {
        id: result.data.id,
        name: result.data.attributes.name,
        email: result.data.attributes.email,
        username: result.data.attributes.username,
        password: result.data.attributes.password,
        link: result.data.attributes.link,
        notes: result.data.attributes.notes,
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