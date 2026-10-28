import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/painel", permanent: false },
});

export default function IndexPage() {
  return null;
}
