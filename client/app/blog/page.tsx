"use client";

import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { DateRangePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import { BlogPost } from "../../components/BlogPost";
import { Chip } from "@nextui-org/chip";
import getData from "@/src/helpers/getData";
import { IBlog } from "@/src/models/blog";
import { Link } from "@nextui-org/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function BlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [selectedProject, setSelectedProject] = useState(
    searchParams.get("project") || ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [dateRange, setDateRange] = useState({
    start: searchParams.get("dateStart") || "",
    end: searchParams.get("dateEnd") || "",
  });
  const [blogs, setBlogs] = useState<IBlog[]>([]);

  const updateURL = (newParams: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && !value.length)) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(value) ? value.join(",") : value);
      }
    });

    router.push(`/blog?${params.toString()}`);
  };

  useEffect(() => {
    const getBlogs = async () => {
      const filters: any = {};

      if (searchQuery) {
        filters.$or = [
          { content: { $containsi: searchQuery } },
          { project: { name: { $containsi: searchQuery } } },
        ];
      }

      if (selectedProject) {
        filters["project"] = { name: selectedProject };
      }

      if (selectedTags.length) {
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
          contribution: { populate: ["contributor"] },
          attachments: { fields: ["url", "name"] },
          project: { fields: ["name", "slug"] },
        },
        filters,
        sort: "isFeatured:desc,createdAt:desc",
      });

      setBlogs(data);
    };

    getBlogs();
  }, [searchQuery, selectedProject, selectedTags, dateRange]);

  useEffect(() => {
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
    setSelectedTags([]);
    setDateRange({ start: "", end: "" });
  };

  const removeProject = () => {
    setSelectedProject("");
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-5xl">Բլոգ</h1>
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Input
          placeholder="Որոնել..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="search"
        />

        <Select
          placeholder="Ընտրել նախագիծը"
          value={selectedProject}
          aria-label="projects"
          onChange={(e) => setSelectedProject(e.target.value)}
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
          selectionMode="multiple"
          value={selectedTags}
          aria-label="tags"
          // TODO make multiple?
          onChange={(e) => setSelectedTags([e.target.value])}
        >
          {/* TODO optimize */}
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
        />

        <div className="flex gap-2">
          <Button variant="flat" className="flex-1" onClick={resetFilters}>
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

          {selectedTags.map((tag) => {
            console.log(selectedTags);

            return (
              <Chip
                key={`tag-${tag}`}
                onClose={() => removeTag(tag)}
                variant="flat"
                color="warning"
                className="capitalize"
              >
                Թեգ: {tag}
              </Chip>
            );
          })}
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className="columns-1 md:columns-3 gap-6 space-y-6">
        {blogs.map((blog, index) => (
          <div key={index} className="break-inside-avoid">
            <BlogPost {...blog} link={true} />
          </div>
        ))}
      </div>
    </div>
  );
}
