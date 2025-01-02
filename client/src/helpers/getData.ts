type IUrlTypes = "projects" | "blogs";

interface IDataParams {
  type: IUrlTypes;
  populate?: string | string[] | Record<string, string[]>;
  slug?: string;
  params?: Record<string, string | number | boolean>;
}

// TODO optimize this function. It works correctly
// TODO add fields choosing functional
// TODO add query by dynamic component (if possible) || create custom query on backend
export default async function getData({
  type,
  slug,
  params = {},
  populate = "*",
}: IDataParams) {
  try {
    const url = getUrl({ type, slug, params, populate });
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
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

function getUrl({ type, slug, params, populate }: IDataParams): string {
  const queryParams: Record<string, string> = {
    ...buildPopulateParams(populate as any),
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
  populate: string | string[] | Record<string, string[]>
): Record<string, string> {
  const flatPopulate: string[] = [];

  if (typeof populate === "string") {
    flatPopulate.push(populate);
  } else if (Array.isArray(populate)) {
    flatPopulate.push(...populate);
  } else {
    Object.entries(populate).forEach(([component, nested]) => {
      flatPopulate.push(component);
      if (Array.isArray(nested)) {
        nested.forEach((nestedComponent) => {
          flatPopulate.push(`${component}.${nestedComponent}`);
        });
      }
    });
  }

  return flatPopulate.reduce(
    (acc, relation, index) => {
      acc[`populate[${index}]`] = relation;
      return acc;
    },
    {} as Record<string, string>
  );
}
