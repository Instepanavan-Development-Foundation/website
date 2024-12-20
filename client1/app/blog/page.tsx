"use client";
import { title } from "@/components/primitives";
import { Card, CardBody } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Chip } from "@nextui-org/chip";
import { Paperclip } from "lucide-react";
import { useState } from "react";
import { Button } from "@nextui-org/button";
import { DateRangePicker } from "@nextui-org/date-picker";
import {parseDate} from "@internationalized/date";

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

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPosts.map((post, index) => (
          <Card key={index} isPressable className="group">
            <CardBody className="p-0">
              {post.img ? (
                <Image
                  alt={post.title}
                  className="w-full object-cover h-[200px]"
                  src={post.img}
                  width="100%"
                  radius="none"
                />
              ) : (
                <div className="w-full h-[200px] bg-gradient-to-br from-primary to-secondary" />
              )}
              <div className="p-5">
                <p className="text-default-500 mb-4">
                  {post.description.length > 150
                    ? `${post.description.slice(0, 150)}...`
                    : post.description}
                </p>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {post.tags.map((tag, tagIndex) => (
                    <Chip key={tagIndex} size="sm" variant="flat">
                      {tag}
                    </Chip>
                  ))}
                </div>

                {/* Contributors */}
                <div className="flex -space-x-2 mb-4">
                  {post.contributors.map((contributor, idx) => (
                    <Image
                      key={idx}
                      src={contributor.avatar}
                      alt={contributor.name}
                      width={32}
                      height={32}
                      className="rounded-full border-2 border-background"
                    />
                  ))}
                </div>

                {/* Attachments */}
                {post.attachments?.length > 0 && (
                  <div className="mt-4">
                    {post.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment.url}
                        className="flex items-center text-blue-500 hover:underline"
                        download
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        {attachment.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
