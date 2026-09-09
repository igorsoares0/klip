import { LinksScreen } from "@/components/screens/links";
import { LinksEmpty } from "@/components/screens/states";
import { links } from "@/lib/mock/links";

export const metadata = { title: "Links · Klip" };

export default function LinksPage() {
  // Real app: this branch keys off the query result count.
  if (links.length === 0) return <LinksEmpty />;
  return <LinksScreen />;
}
