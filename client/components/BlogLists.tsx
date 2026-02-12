"use client";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@heroui/button";
import { DateRangePicker } from "@heroui/date-picker";
import { DateValue, parseDate } from "@internationalized/date";
import { Chip } from "@heroui/chip";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RangeValue } from "@react-types/shared";
import { ArrowDownIcon, Filter } from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/accordion";

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
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  const fetchBlogs = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

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
    setLoading(false);
  }, [loading, searchQuery, selectedProject, selectedTags, dateRange, offset]);

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

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchBlogs();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, fetchBlogs]);

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
    <div className="container mx-auto px-4">
      <h1 className="mb-8 text-5xl">Բլոգ</h1>
      {/* Filters Section */}
      <div className="mb-8">
        {/* Mobile: Collapsible Filters */}
        <div className="block md:hidden">
          <Accordion variant="bordered">
            <AccordionItem
              key="filters"
              aria-label="Ֆիլտրեր"
              title={
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Ֆիլտրեր</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-4 pt-2">
                <Input
                  aria-label="search"
                  placeholder="Որոնել..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <Select
                  aria-label="projects"
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
                      <SelectItem key={project?.name || ""}>
                        {project?.name}
                      </SelectItem>
                    ))}
                </Select>

                <Select
                  aria-label="tags"
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
                      <SelectItem key={tagName}>
                        {tagName}
                      </SelectItem>
                    ))}
                </Select>

                <DateRangePicker
                  aria-label="date-range"
                  value={dateRange as any}
                  onChange={(range) => {
                    if (range?.start && range?.end) {
                      setDateRange(range as any);
                    }
                  }}
                />

                <Button className="w-full" color="warning" onClick={resetFilters}>
                  Չեղարկել
                </Button>
              </div>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Desktop: Always Visible Filters */}
        <div className="hidden md:grid grid-cols-12 gap-4">
          <Input
            aria-label="search"
            className="col-span-12"
            placeholder="Որոնել..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            aria-label="projects"
            className="col-span-4"
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
                <SelectItem key={project?.name || ""}>
                  {project?.name}
                </SelectItem>
              ))}
          </Select>

          <Select
            aria-label="tags"
            className="col-span-4"
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
                <SelectItem key={tagName}>
                  {tagName}
                </SelectItem>
              ))}
          </Select>

          <DateRangePicker
            aria-label="date-range"
            className="col-span-3"
            value={dateRange as any}
            onChange={(range) => {
              if (range?.start && range?.end) {
                setDateRange(range as any);
              }
            }}
          />

          <div className="flex gap-2 col-span-1">
            <Button className="flex-1" color="warning" onClick={resetFilters}>
              Չեղարկել
            </Button>
          </div>
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

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="text-center mt-12 py-4">
        {loading && (
          <div className="text-default-500">Բեռնում...</div>
        )}
        {!hasMore && blogs.length > 0 && (
          <div className="text-default-400 text-sm">Բոլոր հոդվածները ցուցադրված են</div>
        )}
      </div>
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
