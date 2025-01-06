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

// TODO keep filters in url for default value
export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [blogs, setBlogs] = useState<IBlog[]>([]);

  useEffect(() => {
    const getBlogs = async () => {
      const { data }: { data: IBlog[] } = await getData({
        type: "blogs",
        populate: {
          images: { fields: ["url"] },
          contribution: { nested: ["contributor"] },
          attachments: { fields: ["url"] },
        },
      });

      setBlogs(data);
    };

    getBlogs();
  }, []); // TODO add filtering dependencies and add in filters

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedProject("");
    setSelectedTags([]);
    setDateRange({ start: "", end: "" });
  };

  const removeProject = (projectToRemove: string) => {
    // setSelectedProject(selectedProject.filter((p) => p !== projectToRemove));
  };

  // Function to remove a tag filter
  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-5xl">Բլոգ</h1>
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* TODO add filter by query */}
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
          {/* TODO add all projects and configure filter */}
          {[].map((project) => (
            <SelectItem key={project} value={project}>
              {project}
            </SelectItem>
          ))}
        </Select>

        <Select
          placeholder="Ընտրել պիտակները"
          selectionMode="multiple"
          value={selectedTags}
          aria-label="tags"
          onChange={(e) => setSelectedTags(Array.from(e.target.value))}
        >
          {/* TODO add all tags and configure filter */}
          {[].map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </Select>

        <div className="flex gap-2">
          {/* TODO add filter by dateRange */}
          <DateRangePicker
            aria-label="date-range"
            defaultValue={{
              start: parseDate("2024-04-01"), // TODO We don't have startDate and endDate?
              end: parseDate("2024-04-08"),
            }}
            // label="Stay duration"
          />
        </div>

        {/* Filter and Reset Buttons */}
        <div className="flex gap-2">
          <Button
            color="primary"
            className="flex-1"
            onClick={() => {
              // Filter is automatically applied through the filteredPosts logic
            }}
          >
            Զտել
          </Button>
          <Button variant="flat" className="flex-1" onClick={resetFilters}>
            Չեղարկել
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedProject.length > 0 ||
        selectedTags.length > 0 ||
        searchQuery) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Search query chip */}
          {searchQuery && (
            <Chip
              onClose={() => setSearchQuery("")}
              variant="flat"
              color="primary"
            >
              Որոնում: {searchQuery}
            </Chip>
          )}

          {/* Project filters */}
          {selectedProject && (
            <Chip
              key={`project-${selectedProject}`}
              onClose={() => removeProject(selectedProject)}
              variant="flat"
              color="secondary"
              className="capitalize"
            >
              Նախագիծ: {selectedProject}
            </Chip>
          )}

          {/* Tag filters */}
          {selectedTags.map((tag) => (
            <Chip
              key={`tag-${tag}`}
              onClose={() => removeTag(tag)}
              variant="flat"
              color="warning"
              className="capitalize"
            >
              Թեգ: {tag}
            </Chip>
          ))}

          {/* Clear all filters button */}
          {(selectedProject.length > 0 ||
            selectedTags.length > 0 ||
            searchQuery) && (
            <Button
              size="sm"
              variant="light"
              onClick={() => {
                setSelectedProject("");
                setSelectedTags([]);
                setSearchQuery("");
              }}
            >
              Մաքրել բոլորը
            </Button>
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
    </div>
  );
}
