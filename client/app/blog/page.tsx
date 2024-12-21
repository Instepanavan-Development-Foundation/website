"use client";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";

import { useState } from "react";
import { Button } from "@nextui-org/button";
import { DateRangePicker } from "@nextui-org/date-picker";
import {parseDate} from "@internationalized/date";
import { BlogPost } from "../../components/BlogPost";
import { Chip } from "@nextui-org/chip";
import { XIcon } from "lucide-react";

// Import the blogPosts data from a shared location
import { blogPosts } from "../data/blog-posts";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Get unique projects and tags
  const projects = [...new Set(blogPosts.map((post) => post.project))];
  const allTags = [...new Set(blogPosts.flatMap((post) => post.tags))];

  // Filter posts based on criteria
  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !selectedProject || post.project === selectedProject;
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => post.tags.includes(tag));

    // Add date range filtering
    const postDate = new Date(post.date);
    const matchesDateRange =
      (!dateRange.start || postDate >= new Date(dateRange.start)) &&
      (!dateRange.end || postDate <= new Date(dateRange.end));

    return matchesSearch && matchesProject && matchesTags && matchesDateRange;
  });

  // Reset filters function
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedProject("");
    setSelectedTags([]);
    setDateRange({ start: "", end: "" });
  };

  // Function to remove a project filter
  const removeProject = (projectToRemove: string) => {
    setSelectedProject(selectedProject.filter(p => p !== projectToRemove));
  };

  // Function to remove a tag filter
  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
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
        />

        <Select
          placeholder="Ընտրել նախագիծը"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map((project) => (
            <SelectItem key={project} value={project}>
              {project}
            </SelectItem>
          ))}
        </Select>

        <Select
          placeholder="Ընտրել պիտակները"
          selectionMode="multiple"
          value={selectedTags}
          onChange={(e) => setSelectedTags(Array.from(e.target.value))}
        >
          {allTags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </Select>

        {/* Date Range Inputs */}
        <div className="flex gap-2">
          <DateRangePicker
            
            defaultValue={{
              start: parseDate("2024-04-01"),
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
          <Button
            variant="flat"
            className="flex-1"
            onClick={resetFilters}
          >
            Չեղարկել
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedProject.length > 0 || selectedTags.length > 0 || searchQuery) && (
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
          {(selectedProject.length > 0 || selectedTags.length > 0 || searchQuery) && (
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
        {filteredPosts.map((post, index) => (
          <div key={index} className="break-inside-avoid">
            <BlogPost
              date={post.date}
              title={post.title}
              description={post.description}
              img={post.img}
              tags={post.tags}
              contributors={post.contributors}
              attachments={post.attachments}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
