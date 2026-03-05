import { Activity, PageTitle } from "@/components";
import { withAuth } from "@/hocs";
import { useAuth } from "@/hooks";
import { Avatar, Flex, Text, Title, Grid, Stack } from "@mantine/core";
import Head from "next/head";

const Profile = () => {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Mon profil | CDTR</title>
      </Head>
      <PageTitle title="Mon profil" />
      <Flex align="center" gap="md">
        <Avatar color="cyan" radius="xl" size="lg">
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </Avatar>
        <Flex direction="column">
          <Text>{user?.email}</Text>
          <Text>{user?.firstName}</Text>
          <Text>{user?.lastName}</Text>
        </Flex>
      </Flex>

      <Stack mt="xl">
        <Title order={2}>Mes favoris</Title>
        <Grid>
          {user?.favorites && user.favorites.length > 0 ? (
            user.favorites.map((activity) => (
              <Grid.Col span={4} key={activity.id}>
                <Activity activity={activity} />
              </Grid.Col>
            ))
          ) : (
            <Grid.Col span={12}>
              <Text>Vous n&apos;avez pas encore de favoris.</Text>
            </Grid.Col>
          )}
        </Grid>
      </Stack>
    </>
  );
};

export default withAuth(Profile);
