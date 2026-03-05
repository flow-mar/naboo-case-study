import { Activity, EmptyData, PageTitle } from "@/components";
import { graphqlClient } from "@/graphql/apollo";
import {
  GetActivitiesQuery,
  GetActivitiesQueryVariables,
} from "@/graphql/generated/types";
import GetActivities from "@/graphql/queries/activity/getActivities";
import { useAuth } from "@/hooks";
import { Button, Grid, Group } from "@mantine/core";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";

interface DiscoverProps {
  activities: GetActivitiesQuery["getActivities"];
}

export const getServerSideProps: GetServerSideProps<
  DiscoverProps
> = async ({req}) => {
  const response = await graphqlClient.query<
    GetActivitiesQuery,
    GetActivitiesQueryVariables
  >({
    query: GetActivities,
    context: { headers: { Cookie: req.headers.cookie || "" } },
  });
  return { props: { activities: response.data.getActivities } };
};

export default function Discover({ activities }: DiscoverProps) {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Discover | CDTR</title>
      </Head>
      <Group position="apart">
        <PageTitle title="Découvrez des activités" />
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
}
