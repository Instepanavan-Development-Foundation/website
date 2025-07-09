"use client";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { DateRangePicker } from "@nextui-org/date-picker";
import { DateValue, parseDate } from "@internationalized/date";
import { Chip } from "@nextui-org/chip";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RangeValue } from "@react-types/shared";
import { ArrowDownIcon } from "lucide-react";

import { BlogPost } from "./BlogPost";

import getData from "@/src/helpers/getData";
import { IBlog } from "@/src/models/blog";
import { INestedObject } from "@/src/models/getData";

const LIMIT = Number(process.env.NEXT_PUBLIC_QUERY_LIMIT || 10);

function BlogListUnwrapped() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedProject, setSelectedProject] = useState(
    searchParams.get("project") || "",
  );
  const [selectedTags, setSelectedTags] = useState<string>(
    searchParams.get("tags") || "",
  );

  const defaultDateRange = {
    start: searchParams.get("dateStart")
      ? parseDate(searchParams.get("dateStart") || "")
      : undefined,
    end: searchParams.get("dateEnd")
      ? parseDate(searchParams.get("dateEnd") || "")
      : undefined,
  } as RangeValue<DateValue>;

  const [dateRange, setDateRange] =
    useState<RangeValue<DateValue>>(defaultDateRange);

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
    const filters: INestedObject = {};

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
        $between: [dateRange.start.toString(), dateRange.end.toString()],
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
      sort: "createdAt:desc",
      offset: reset ? 0 : offset,
      limit: LIMIT,
    });

    if (reset) {
      setBlogs(data);
      setOffset(data.length);
    } else {
      setBlogs((prevBlogs) => [...prevBlogs, ...data]);
      setOffset((prevOffset) => prevOffset + data.length);
    }

    setHasMore(data.length === LIMIT);
  };

  useEffect(() => {
    fetchBlogs(true);
    updateURL({
      search: searchQuery,
      project: selectedProject,
      tags: selectedTags,
      dateStart: dateRange.start?.toString(),
      dateEnd: dateRange.end?.toString(),
    });
  }, [searchQuery, selectedProject, selectedTags, dateRange]);

  const resetFilters = () => {
    const noDateRange = {
      start: undefined,
      end: undefined,
    } as unknown as RangeValue<DateValue>;

    setSearchQuery("");
    setSelectedProject("");
    setSelectedTags("");
    setDateRange(noDateRange);
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
          aria-label="search"
          className="col-span-full md:col-span-12"
          placeholder="Որոնել..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Select
          aria-label="projects"
          className="col-span-full md:col-span-4"
          placeholder="Ընտրել նախագիծը"
          selectedKeys={selectedProject ? [selectedProject] : []}
          onChange={(e) => {
            const value = e.target.value;

            setSelectedProject(value);
            updateURL({ project: value });
          }}
        >
          {blogs
            .map((blog) => blog.project)
            .filter(
              (project, index, self) =>
                project &&
                self.findIndex((p) => p?.name === project?.name) === index,
            )
            .map((project) => (
              <SelectItem key={project?.name} value={project?.name || ""}>
                {project?.name}
              </SelectItem>
            ))}
        </Select>

        <Select
          aria-label="tags"
          className="col-span-full md:col-span-4"
          placeholder="Ընտրել պիտակները"
          selectedKeys={selectedTags ? [selectedTags] : []}
          onChange={(e) => {
            const value = e.target.value;

            setSelectedTags(value);
            updateURL({ tags: value });
          }}
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
          className="col-span-full md:col-span-3"
          value={dateRange as any}
          onChange={(range) => {
            if (range?.start && range?.end) {
              setDateRange(range as any);
            }
          }}
        />

        <div className="flex gap-2 col-span-full md:col-span-1">
          <Button className="flex-1" color="warning" onClick={resetFilters}>
            Չեղարկել
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedProject || selectedTags.length > 0 || searchQuery) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchQuery && (
            <Chip
              color="primary"
              variant="flat"
              onClose={() => setSearchQuery("")}
            >
              Որոնում: {searchQuery}
            </Chip>
          )}

          {selectedProject && (
            <Chip
              className="capitalize"
              color="secondary"
              variant="flat"
              onClose={removeProject}
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
              className="capitalize"
              color="warning"
              variant="flat"
              onClose={() => removeTag()}
            >
              Թեգ: {selectedTags}
            </Chip>
          )}
        </div>
      )}

      {/* Blog Posts Grid - Using standard grid with same height cards */}
      {!blogs.length && (
        <div className="text-center py-12 bg-default-50/50 rounded-lg">
          <p className="text-default-500">Նախագծեր չկան</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {blogs.map((blog, index) => (
          <div
            key={index}
            className="h-full transform hover:-translate-y-1 transition-transform duration-300"
          >
            <BlogPost {...blog} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-12">
          <Button
            className="px-6"
            color="primary"
            endContent={<ArrowDownIcon className="w-4 h-4" />}
            size="lg"
            variant="flat"
            onClick={() => fetchBlogs()}
          >
            Բեռնել ավելին
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Searchbar() {
  return (
    <Suspense>
      <BlogListUnwrapped />
    </Suspense>
  );
}
