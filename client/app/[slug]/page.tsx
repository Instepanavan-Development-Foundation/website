import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";

import getData from "@/src/helpers/getData";
import { IStaticPage } from "@/src/models/stat-page";
import ModifiedMarkdown from '@/src/hok/modifiedMarkdown';

interface IProjectPageParams {
    params: { slug: string };
}

export default async function StaticPage({ params }: IProjectPageParams) {
    const { slug } = await params;

    const { data }: { data: IStaticPage[] } = await getData({
        type: "static-pages",
        filters: { slug },
    });

    const staticPage = data[0];
    if (!staticPage) {
        return null; // TODO not found component
    }

    return (
        <div className="container mx-auto">
            <Card>
                <CardHeader className="flex justify-center">
                    <h1 className="text-5xl font-bold text-center">{staticPage.title}</h1>
                </CardHeader>
                <CardBody>
                    <div className="prose">
                        <ModifiedMarkdown>{staticPage.description}</ModifiedMarkdown>
                    </div>
                </CardBody>
                <CardFooter />
            </Card>
        </div>
    );
}
