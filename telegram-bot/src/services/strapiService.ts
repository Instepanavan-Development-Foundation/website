import axios from "axios";
import FormData from "form-data";
import { config } from "../config";

const api = axios.create({
  baseURL: config.strapiBaseUrl,
  headers: {
    Authorization: `Bearer ${config.strapiApiToken}`,
  },
});

export interface Project {
  documentId: string;
  name: string;
  isFeatured: boolean;
  isArchived: boolean;
  isMain: boolean;
}

export async function getProjects(): Promise<Project[]> {
  const res = await api.get("/api/projects", {
    params: {
      "fields[0]": "name",
      "fields[1]": "documentId",
      "fields[2]": "isFeatured",
      "fields[3]": "isArchived",
      "fields[4]": "isMain",
      "pagination[pageSize]": 100,
    },
  });

  const projects: Project[] = (res.data.data ?? []).map(
    (p: { documentId: string; name: string; isFeatured: boolean; isArchived: boolean; isMain: boolean }) => ({
      documentId: p.documentId,
      name: p.name,
      isFeatured: p.isFeatured ?? false,
      isArchived: p.isArchived ?? false,
      isMain: p.isMain ?? false,
    })
  );

  // Sort: main (slider) first, then featured, then active, then archived
  return projects.sort((a, b) => {
    if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
    if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export interface Contributor {
  documentId: string;
  fullName: string;
  about: string;
}

export async function getContributors(): Promise<Contributor[]> {
  const res = await api.get("/api/contributors", {
    params: {
      "fields[0]": "fullName",
      "fields[1]": "documentId",
      "fields[2]": "about",
      "pagination[pageSize]": 200,
    },
  });

  return (res.data.data ?? []).map((c: Contributor) => ({
    documentId: c.documentId,
    fullName: c.fullName,
    about: c.about ?? "",
  }));
}

export async function createContributor(fullName: string): Promise<Contributor> {
  // Generate placeholder email — can be updated later in Strapi admin
  const placeholderEmail = `${fullName.toLowerCase().replace(/\s+/g, ".")}@instepanavan.am`;
  const res = await api.post("/api/contributors", {
    data: { fullName, email: placeholderEmail },
  });
  const c = res.data.data;
  return { documentId: c.documentId, fullName: c.fullName, about: "" };
}

interface Tag {
  documentId: string;
  name: string;
}

async function fetchAllTags(): Promise<Tag[]> {
  const res = await api.get("/api/tags", {
    params: {
      "fields[0]": "name",
      "fields[1]": "documentId",
      "pagination[pageSize]": 200,
    },
  });
  return (res.data.data ?? []).map((t: Tag) => ({ documentId: t.documentId, name: t.name }));
}

export async function getTags(): Promise<string[]> {
  const tags = await fetchAllTags();
  return tags.map((t) => t.name);
}

export async function getOrCreateTags(tagNames: string[]): Promise<string[]> {
  if (tagNames.length === 0) return [];

  const existing = await fetchAllTags();
  const documentIds: string[] = [];

  for (const name of tagNames) {
    const match = existing.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (match) {
      documentIds.push(match.documentId);
    } else {
      const res = await api.post("/api/tags", { data: { name } });
      documentIds.push(res.data.data.documentId);
      existing.push({ documentId: res.data.data.documentId, name });
    }
  }

  return documentIds;
}

export async function uploadImage(imageBuffer: Buffer, index: number): Promise<number> {
  const form = new FormData();
  form.append("files", imageBuffer, {
    filename: `blog_image_${index}.jpg`,
    contentType: "image/jpeg",
  });

  const res = await api.post("/api/upload", form, {
    headers: form.getHeaders(),
  });

  return res.data[0].id as number;
}

export async function uploadAllImages(imageBuffers: Buffer[]): Promise<number[]> {
  return Promise.all(imageBuffers.map((buf, i) => uploadImage(buf, i)));
}

export async function createBlog(params: {
  content: string;
  slug?: string;
  imageIds: number[];
  tagNames: string[];
  projectDocumentId: string | null;
  contributorDocumentIds: string[];
}): Promise<{ documentId: string; slug: string }> {
  const data: Record<string, unknown> = {
    content: params.content,
    images: params.imageIds,
    tag: params.tagNames.map((name) => ({ name })),
    isArchive: false,
    isFeatured: false,
  };

  if (params.slug) {
    data.slug = params.slug;
  }

  if (params.projectDocumentId) {
    data.project = { connect: [{ documentId: params.projectDocumentId }] };
  }

  if (params.contributorDocumentIds.length > 0) {
    data.contribution = params.contributorDocumentIds.map((documentId) => ({
      contributor: { connect: [{ documentId }] },
      text: "",
      isFeatured: false,
    }));
  }

  const res = await api.post("/api/blogs", { data });
  const blog = res.data.data;
  return { documentId: blog.documentId, slug: blog.slug };
}

export async function deleteBlog(documentId: string): Promise<void> {
  await api.delete(`/api/blogs/${documentId}`);
}
