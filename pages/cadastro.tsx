import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/register", permanent: false },
});
export default function LegacyRegister() {
  return null;
}
