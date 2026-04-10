const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.message ?? 'Request failed.');
    error.status = response.status;
    throw error;
  }

  return payload;
}

function splitFilesIntoBatches(files, maxFilesPerBatch = 25, maxBatchBytes = 20 * 1024 * 1024) {
  const batches = [];
  let currentBatch = [];
  let currentBytes = 0;

  files.forEach((file) => {
    const fileSize = file.size ?? 0;
    const wouldOverflowCount = currentBatch.length >= maxFilesPerBatch;
    const wouldOverflowSize = currentBatch.length > 0 && currentBytes + fileSize > maxBatchBytes;

    if (wouldOverflowCount || wouldOverflowSize) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBytes = 0;
    }

    currentBatch.push(file);
    currentBytes += fileSize;
  });

  if (currentBatch.length) {
    batches.push(currentBatch);
  }

  return batches;
}

export async function getAdminProjects(adminKey) {
  return request('/api/admin/projects', {
    headers: {
      'x-admin-key': adminKey,
    },
  });
}

export async function createAdminProject(adminKey, body) {
  return request('/api/admin/projects', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify(body),
  });
}

export async function uploadAdminProjectFiles(adminKey, projectId, files, onProgress) {
  const batches = splitFilesIntoBatches(files);
  let uploadedCount = 0;
  let lastResponse = null;
  const maxRetriesPerBatch = 2;

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const formData = new FormData();

    batch.forEach((file) => {
      formData.append('files', file);
      formData.append('relativePaths', file.webkitRelativePath || file.name);
    });

    let attempt = 0;
    while (attempt <= maxRetriesPerBatch) {
      try {
        lastResponse = await request(`/api/admin/projects/${projectId}/files`, {
          method: 'POST',
          headers: {
            'x-admin-key': adminKey,
          },
          body: formData,
        });
        break;
      } catch (error) {
        const isRetriable = !error.status || error.status >= 500;
        if (!isRetriable || attempt === maxRetriesPerBatch) {
          const failedBatch = index + 1;
          const reason = error.message || 'Batch upload failed.';
          throw new Error(`Upload failed on batch ${failedBatch}/${batches.length}: ${reason}`);
        }

        attempt += 1;
      }
    }

    uploadedCount += batch.length;

    if (typeof onProgress === 'function') {
      onProgress({
        batchIndex: index + 1,
        batchCount: batches.length,
        uploadedCount,
        totalCount: files.length,
      });
    }
  }

  return {
    message: lastResponse?.message ?? `${files.length} file(s) uploaded in ${batches.length} batch(es).`,
    filesCount: lastResponse?.filesCount,
    tree: lastResponse?.tree,
    batchCount: batches.length,
    uploadedCount: files.length,
  };
}

export async function shareAdminProject(adminKey, projectId, body) {
  return request(`/api/admin/projects/${projectId}/share`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify(body),
  });
}

export async function deleteAdminProject(adminKey, projectId) {
  return request(`/api/admin/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'x-admin-key': adminKey,
    },
  });
}

// New slug-based client API
export async function getSharedProject(projectSlug, token) {
  return request(`/api/client/project/${encodeURIComponent(projectSlug)}/${encodeURIComponent(token)}`);
}

export async function getSharedFile(projectSlug, token, fileId) {
  return request(`/api/client/project/${encodeURIComponent(projectSlug)}/${encodeURIComponent(token)}/file/${encodeURIComponent(fileId)}`);
}
