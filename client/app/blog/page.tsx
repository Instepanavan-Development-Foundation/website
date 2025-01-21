"use client";

import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { DateRangePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import { Chip } from "@nextui-org/chip";
import { useRouter, useSearchParams } from "next/navigation";

import { BlogPost } from "../../components/BlogPost";
import getData from "@/src/helpers/getData";
import { IBlog } from "@/src/models/blog";

const limit = Number(process.env.NEXT_PUBLIC_QUERY_LIMIT) || 10;

// TODO add metadata in all pages
export default function BlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [selectedProject, setSelectedProject] = useState(
    searchParams.get("project") || ""
  );
  const [selectedTags, setSelectedTags] = useState<string>(
    searchParams.get("tags") || ""
  );
  const [dateRange, setDateRange] = useState({
    start: searchParams.get("dateStart") || "",
    end: searchParams.get("dateEnd") || "",
  });
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const updateURL = (newParams: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(value) ? value.join(",") : value);
      }
    });

    router.push(`/blog?${params.toString()}`);
  };

  const fetchBlogs = async (reset = false) => {
    const filters: any = {};

    if (searchQuery) {
      filters.$or = [
        { content: { $containsi: searchQuery } },
        { project: { name: { $containsi: searchQuery } } },
      ];
    }

    if (selectedProject) {
      filters.project = { name: selectedProject };
    }

    if (selectedTags) {
      filters.tag = {
        $containsi: selectedTags,
      };
    }

    if (dateRange.start && dateRange.end) {
      filters.createdAt = {
        $between: [dateRange.start, dateRange.end],
      };
    }

    const { data }: { data: IBlog[] } = await getData({
      type: "blogs",
      populate: {
        images: { fields: ["url"] },
        contribution: { populate: ["contributor.avatar"] },
        attachments: { fields: ["url", "name"] },
        project: { fields: ["name", "slug"] },
      },
      filters,
      sort: "isFeatured:desc,createdAt:desc",
      offset: reset ? 0 : offset,
      limit,
    });

    if (reset) {
      setBlogs(data);
      setOffset(data.length);
    } else {
      setBlogs((prevBlogs) => [...prevBlogs, ...data]);
      setOffset((prevOffset) => prevOffset + data.length);
    }

    setHasMore(data.length === limit);
  };

  useEffect(() => {
    fetchBlogs(true);
    updateURL({
      search: searchQuery,
      project: selectedProject,
      tags: selectedTags,
      dateStart: dateRange.start,
      dateEnd: dateRange.end,
    });
  }, [searchQuery, selectedProject, selectedTags, dateRange]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedProject("");
    setSelectedTags("");
    setDateRange({ start: "", end: "" });
    updateURL({
      search: "",
      project: "",
      tags: "",
      dateStart: "",
      dateEnd: "",
    });
  };

  const removeProject = () => {
    setSelectedProject("");
  };

  const removeTag = () => {
    setSelectedTags("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-5xl">Բլոգ</h1>
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
        <Input
          placeholder="Որոնել..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="search"
          className="col-span-full md:col-span-12"
        />

        <Select
          placeholder="Ընտրել նախագիծը"
          selectedKeys={selectedProject ? [selectedProject] : []}
          aria-label="projects"
          onChange={(e) => {
            const value = e.target.value;
            setSelectedProject(value);
            updateURL({ project: value });
          }}
          className="col-span-full md:col-span-4"
        >
          {blogs
            .map((blog) => blog.project)
            .filter(
              (project, index, self) =>
                project &&
                self.findIndex((p) => p?.name === project?.name) === index
            )
            .map((project) => (
              <SelectItem key={project?.name} value={project?.name || ""}>
                {project?.name}
              </SelectItem>
            ))}
        </Select>

        <Select
          placeholder="Ընտրել պիտակները"
          selectedKeys={selectedTags ? [selectedTags] : []}
          aria-label="tags"
          onChange={(e) => {
            const value = e.target.value;
            setSelectedTags(value);
            updateURL({ tags: value });
          }}
          className="col-span-full md:col-span-4"
        >
          {blogs
            .flatMap((blog) => blog.tag || [])
            .map((tag) => tag.name)
            .filter((tagName, index, self) => self.indexOf(tagName) === index)
            .map((tagName) => (
              <SelectItem key={tagName} value={tagName}>
                {tagName}
              </SelectItem>
            ))}
        </Select>

        <DateRangePicker
          aria-label="date-range"
          value={
            dateRange.start && dateRange.end
              ? {
                  start: parseDate(dateRange.start),
                  end: parseDate(dateRange.end),
                }
              : undefined
          }
          onChange={(range) => {
            if (range) {
              setDateRange({
                start: range.start.toString(),
                end: range.end.toString(),
              });
            }
          }}
          className="col-span-full md:col-span-3"
        />

        <div className="flex gap-2 col-span-full md:col-span-1">
          <Button color="warning" className="flex-1" onClick={resetFilters}>
            Չեղարկել
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedProject || selectedTags.length > 0 || searchQuery) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchQuery && (
            <Chip
              onClose={() => setSearchQuery("")}
              variant="flat"
              color="primary"
            >
              Որոնում: {searchQuery}
            </Chip>
          )}

          {selectedProject && (
            <Chip
              onClose={removeProject}
              variant="flat"
              color="secondary"
              className="capitalize"
            >
              Նախագիծ:{" "}
              {
                blogs.find((b) => b.project?.name === selectedProject)?.project
                  ?.name
              }
            </Chip>
          )}

          {selectedTags && (
            <Chip
              key={`tag-${selectedTags}`}
              onClose={() => removeTag()}
              variant="flat"
              color="warning"
              className="capitalize"
            >
              Թեգ: {selectedTags}
            </Chip>
          )}
        </div>
      )}

      {/* Blog Posts Grid - Modified for Masonry layout */}
      <div className="columns-1 md:columns-3 gap-6 space-y-6">
        {blogs.map((blog, index) => (
          <div key={index} className="break-inside-avoid">
            <BlogPost {...blog} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-8">
          <Button color="primary" onClick={() => fetchBlogs()}>
            Բեռնել ավելին
          </Button>
        </div>
      )}
    </div>
  );
}
