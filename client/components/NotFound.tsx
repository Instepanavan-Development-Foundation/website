import { Button } from "@nextui-org/button";
import { Link } from "@heroui/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center mt-10 gap-4">
      <h1 className="text-center text-4xl font-bold">404: Էջը չի գտնվել</h1>
      <hr className="my-4 border-gray-300 w-1/2" />
      <p className="text-center text-lg">
        Մենք չգտանք ենք այդ էջը, կամ այն չի գտնվել է այս կայքում։
      </p>
      <Link href="/" >
        <Button>Գնալ գլխավոր էջ</Button>
      </Link>
    </div>
  );
}

