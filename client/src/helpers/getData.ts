type IUrlTypes = "projects" | "blogs" | "contributors";

interface IDataParams {
  type: IUrlTypes;
  populate?: Record<
    string,
    {
      fields?: string[];
      nested?: string[] | Record<string, { fields?: string[] }>;
    }
  >;
  slug?: string;
  params?: Record<string, string | number | boolean>;
  fields?: string[];
}

// TODO optimize this function. It works correctly
// TODO add fields choosing functional
// TODO add query by dynamic component (if possible) || create custom query on backend
export default async function getData({
  type,
  slug,
  params = {},
  populate = {},
  fields = [],
}: IDataParams): Promise<{ data: any[] }> {
  try {
    const url = getUrl({ type, slug, params, populate, fields });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api${url}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.statusText}`);
    }

    return res.json();
  } catch (e) {
    console.log(e);

    return { data: [] };
  }
}

function getUrl({ type, slug, params, populate, fields }: IDataParams): string {
  const queryParams: Record<string, string> = {
    ...buildPopulateParams(populate as any),
    ...buildFieldsParams(fields as string[]),
    ...Object.fromEntries(
      Object.entries(params as any).map(([key, value]: any) => [
        key,
        value.toString(),
      ])
    ),
  };

  if (slug) {
    queryParams["filters[slug][$eq]"] = slug;
  }

  const queryString = new URLSearchParams(queryParams).toString();
  return `/${type}?${queryString}`;
}

function buildPopulateParams(
  populate: Record<string, { fields?: string[]; nested?: string[] }>
): Record<string, string> {
  const query: Record<string, string> = {};

  Object.entries(populate).forEach(([component, options]) => {
    if (typeof options === "object") {
      // Handle nested relations
      if (options.nested) {
        options.nested.forEach((nestedComponent, index) => {
          query[`populate[${component}][populate][${index}]`] = nestedComponent;
        });
      }

      // Handle fields for the component
      if (options.fields) {
        options.fields.forEach((field, index) => {
          query[`populate[${component}][fields][${index}]`] = field;
        });
      }
    } else {
      // Handle empty objects or string components
      query[`populate[${component}]`] = component;
    }
  });

  return query;
}


function buildFieldsParams(fields: string[]): Record<string, string> {
  if (!fields.length) {
    return {};
  }

  return fields.reduce(
    (acc, field, index) => {
      acc[`fields[${index}]`] = field;
      return acc;
    },
    {} as Record<string, string>
  );
}
