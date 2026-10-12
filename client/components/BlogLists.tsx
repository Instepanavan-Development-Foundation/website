"use client";
import {
  Accordion,
  Button,
  Chip,
  CloseButton,
  DateField,
  DateRangePicker,
  Input,
  ListBox,
  RangeCalendar,
  Select,
} from "@heroui/react";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { DateValue, parseDate } from "@internationalized/date";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RangeValue } from "@react-types/shared";
import { Filter } from "lucide-react";

import getData from "@/src/helpers/getData";
import { IBlog } from "@/src/models/blog";
import { INestedObject } from "@/src/models/getData";

import { BlogPost } from "./BlogPost";

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

  const fetchBlogs = useCallback(
    async (reset = false) => {
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
    },
    [loading, searchQuery, selectedProject, selectedTags, dateRange, offset],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/filter-change effect; fetchBlogs flips `loading` before the request starts
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
      { threshold: 0.1 },
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

  const projectNames = blogs
    .map((blog) => blog.project?.name)
    .filter(
      (name, index, self): name is string =>
        !!name && self.indexOf(name) === index,
    );
  const tagNames = blogs
    .flatMap((blog) => blog.tag || [])
    .map((tag) => tag.name)
    .filter((tagName, index, self) => self.indexOf(tagName) === index);

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    updateURL({ project: value });
  };

  const handleTagChange = (value: string) => {
    setSelectedTags(value);
    updateURL({ tags: value });
  };

  const handleDateRangeChange = (range: RangeValue<DateValue> | null) => {
    if (range?.start && range?.end) {
      setDateRange(range);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="mb-8 text-5xl">Բլոգ</h1>
      {/* Filters Section */}
      <div className="mb-8">
        {/* Mobile: Collapsible Filters */}
        <div className="block md:hidden">
          <Accordion className="px-2 border border-border rounded-medium">
            <Accordion.Item id="filters">
              <Accordion.Heading>
                <Accordion.Trigger aria-label="Ֆիլտրեր">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>Ֆիլտրեր</span>
                  </div>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    <SearchInput
                      value={searchQuery}
                      onChange={setSearchQuery}
                    />

                    <FilterSelect
                      ariaLabel="projects"
                      options={projectNames}
                      placeholder="Ընտրել նախագիծը"
                      value={selectedProject}
                      onChange={handleProjectChange}
                    />

                    <FilterSelect
                      ariaLabel="tags"
                      options={tagNames}
                      placeholder="Ընտրել պիտակները"
                      value={selectedTags}
                      onChange={handleTagChange}
                    />

                    <DateRangeFilter
                      value={dateRange}
                      onChange={handleDateRangeChange}
                    />

                    <Button fullWidth variant="primary" onPress={resetFilters}>
                      Չեղարկել
                    </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </div>

        {/* Desktop: Always Visible Filters */}
        <div className="hidden md:grid grid-cols-12 gap-4">
          <SearchInput
            className="col-span-12"
            value={searchQuery}
            onChange={setSearchQuery}
          />

          <FilterSelect
            ariaLabel="projects"
            className="col-span-4"
            options={projectNames}
            placeholder="Ընտրել նախագիծը"
            value={selectedProject}
            onChange={handleProjectChange}
          />

          <FilterSelect
            ariaLabel="tags"
            className="col-span-4"
            options={tagNames}
            placeholder="Ընտրել պիտակները"
            value={selectedTags}
            onChange={handleTagChange}
          />

          <DateRangeFilter
            className="col-span-3"
            value={dateRange}
            onChange={handleDateRangeChange}
          />

          <div className="flex gap-2 col-span-1">
            <Button className="flex-1" variant="primary" onPress={resetFilters}>
              Չեղարկել
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedProject || selectedTags.length > 0 || searchQuery) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchQuery && (
            <FilterChip onClose={() => setSearchQuery("")}>
              Որոնում: {searchQuery}
            </FilterChip>
          )}

          {selectedProject && (
            <FilterChip className="capitalize" onClose={removeProject}>
              Նախագիծ:{" "}
              {
                blogs.find((b) => b.project?.name === selectedProject)?.project
                  ?.name
              }
            </FilterChip>
          )}

          {selectedTags && (
            <FilterChip
              key={`tag-${selectedTags}`}
              className="capitalize"
              onClose={() => removeTag()}
            >
              Թեգ: {selectedTags}
            </FilterChip>
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
        {loading && <div className="text-default-500">Բեռնում...</div>}
        {!hasMore && blogs.length > 0 && (
          <div className="text-default-400 text-sm">
            Բոլոր հոդվածները ցուցադրված են
          </div>
        )}
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Input
      fullWidth
      aria-label="search"
      className={className}
      placeholder="Որոնել..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Single-select filter; `""` means no selection (as with the v2 Select). */
function FilterSelect({
  ariaLabel,
  placeholder,
  options,
  value,
  onChange,
  className,
}: {
  ariaLabel: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Select
      fullWidth
      aria-label={ariaLabel}
      className={className}
      placeholder={placeholder}
      value={value || null}
      onChange={(key) => onChange(key == null ? "" : String(key))}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.ClearButton />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option} id={option} textValue={option}>
              {option}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: RangeValue<DateValue>;
  onChange: (range: RangeValue<DateValue> | null) => void;
  className?: string;
}) {
  return (
    <DateRangePicker
      aria-label="date-range"
      className={className}
      value={value.start && value.end ? value : null}
      onChange={onChange}
    >
      <DateField.Group fullWidth>
        <DateField.Input slot="start">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateRangePicker.RangeSeparator />
        <DateField.Input slot="end">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DateRangePicker.Trigger>
            <DateRangePicker.TriggerIndicator />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar aria-label="date-range">
          <RangeCalendar.Header>
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => (
                <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
              )}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}

/** Active-filter chip with a remove button (v2 Chip `onClose`). */
function FilterChip({
  children,
  className,
  onClose,
}: {
  children: ReactNode;
  className?: string;
  onClose: () => void;
}) {
  return (
    <Chip className={className} color="accent" variant="soft">
      <Chip.Label>{children}</Chip.Label>
      <CloseButton aria-label="close chip" onPress={onClose} />
    </Chip>
  );
}

export default function Searchbar() {
  return (
    <Suspense>
      <BlogListUnwrapped />
    </Suspense>
  );
}
