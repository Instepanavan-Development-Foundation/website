import qs from "qs";
type IUrlTypes = "projects" | "blogs" | "contributors";

interface IDataParams {
  type: IUrlTypes;
  populate?: any;
  filters?: any;
  params?: string;
  fields?: string[];
}

// TODO add query by dynamic component (if possible) || create custom query on backend
export default async function getData({
  type,
  params = "",
  filters = {},
  populate = {},
  fields = [],
}: IDataParams): Promise<{ data: any[] }> {
  const query = qs.stringify({
    populate,
    fields,
    params,
    filters,
  });
  
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${type}?${query}&${params}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.statusText}`);
    }

    return res.json();
  } catch (e) {
    console.log(e);

    return { data: [] };
  }
}
