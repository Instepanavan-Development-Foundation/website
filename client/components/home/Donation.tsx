import Link from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";

export default function Donation() {
  return (
    <div className="w-full container my-16 text-center">
      <h2 className="text-4xl font-bold mb-4">Աջակցեք մեր առաքելությանը</h2>
      <p className="text-default-500 text-xl mb-8 max-w-2xl mx-auto">
        Ձեր ներդրումն օգնում է մեզ շարունակել նորարարական լուծումների կառուցումը
        և աջակցել մեր համայնքին: Յուրաքանչյուր նվիրատվություն տարբերություն է
        ստեղծում:
      </p>
      <Link
        href="#"
        className={buttonStyles({
          color: "success",
          radius: "full",
          variant: "shadow",
          size: "lg",
        })}
      >
        <span className="text-xl px-8 py-2">Նվիրաբերել հիմա</span>
      </Link>
    </div>
  );
}
