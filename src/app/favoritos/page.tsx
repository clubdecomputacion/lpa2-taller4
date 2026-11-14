import type { Metadata } from "next";

import Favoritos from "./Favoritos";

export const metadata: Metadata = { title: "Favoritos" };

export default function Page() {
  return <Favoritos />;
}
