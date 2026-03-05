import { Activity, EmptyData, PageTitle } from "@/components";
import { graphqlClient } from "@/graphql/apollo";
import {
  GetUserActivitiesQuery,
  GetUserActivitiesQueryVariables,
} from "@/graphql/generated/types";
import GetUserActivities from "@/graphql/queries/activity/getUserActivities";
import { withAuth } from "@/hocs";
import { useAuth } from "@/hooks";
import { Button, Grid, Group } from "@mantine/core";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";

interface MyActivitiesProps {
  activities: GetUserActivitiesQuery["getActivitiesByUser"];
}

export const getServerSideProps: GetServerSideProps<
  MyActivitiesProps
> = async ({ req }) => {
  const response = await graphqlClient.query<
    GetUserActivitiesQuery,
    GetUserActivitiesQueryVariables
  >({
    query: GetUserActivities,
    context: { headers: { Cookie: req.headers.cookie } },
  });
  return { props: { activities: response.data.getActivitiesByUser } };
};

const MyActivities = ({ activities }: MyActivitiesProps) => {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Mes activités | CDTR</title>
      </Head>
      <Group position="apart">
        <PageTitle title="Mes activités" />
        {user && (
          <Link href="/activities/create">
            <Button>Ajouter une activité</Button>
          </Link>
        )}
      </Group>
      <Grid>
        {activities.length > 0 ? (
          activities.map((activity) => (
            <Grid.Col span={4} key={activity.id}>
              <Activity activity={activity} />
            </Grid.Col>
          ))
        ) : (
          <EmptyData />
        )}
      </Grid>
    </>
  );
};

export default withAuth(MyActivities);
