import Page_ from "@ente/accounts/pages/two-factor/recover";
import { useAppContext } from "../_app";

const Page = () => <Page_ appContext={useAppContext()} />;

export default Page;
