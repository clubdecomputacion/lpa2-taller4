import type { Metadata } from "next";

import Canciones from "./Canciones";

export const metadata: Metadata = { title: "Canciones" };

export default function Page() {
  return <Canciones />;
}
