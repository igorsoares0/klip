import { LinkDetailScreen } from "@/components/screens/link-detail";

export default async function LinkDetailPage(
  props: PageProps<"/dashboard/links/[id]">,
) {
  const { id } = await props.params;
  return <LinkDetailScreen id={id} />;
}
