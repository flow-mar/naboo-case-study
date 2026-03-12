import { Activity, PageTitle } from "@/components";
import { withAuth } from "@/hocs";
import { useAuth } from "@/hooks";
import { Avatar, Flex, Text, Title, Grid, Stack } from "@mantine/core";
import Head from "next/head";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import ReorderFavorites from "@/graphql/mutations/user/reorderFavorites";
import GetUser from "@/graphql/queries/auth/getUser";

import {
  ActivityFragment,
  GetUserQuery,
  GetUserQueryVariables,
} from "@/graphql/generated/types";

const SortableActivity = ({ activity }: { activity: ActivityFragment }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 0,
    position: 'relative' as const,
  };

  return (
    <Grid.Col span={4} ref={setNodeRef} style={style}>
      <Activity
        activity={activity}
        isSortable
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </Grid.Col>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const apolloClient = useApolloClient();
  const [favorites, setFavorites] = useState(
    user?.favorites?.edges?.map((e) => e.node) || [],
  );
  const [reorderFavorites] = useMutation(ReorderFavorites);

  useEffect(() => {
    if (user?.favorites?.edges) {
      setFavorites(user.favorites.edges.map((e) => e.node));
    }
  }, [user?.favorites]);

  const refreshUser = async () => {
    const { data } = await apolloClient.query<GetUserQuery, GetUserQueryVariables>({
      query: GetUser,
      fetchPolicy: "network-only",
    });
    setUser(data.getMe);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((f) => f.id === active.id);
      const newIndex = favorites.findIndex((f) => f.id === over.id);

      const newFavorites = arrayMove(favorites, oldIndex, newIndex);
      setFavorites(newFavorites);

      reorderFavorites({
        variables: {
          ids: newFavorites.map((f) => f.id),
        },
      }).then((res) => {
        if (res.data?.reorderFavorites) {
          refreshUser();
        }
      }).catch((err) => {
        console.error("Failed to reorder favorites", err);
        // Revert on error
        setFavorites(user?.favorites?.edges?.map((e) => e.node) || []);
      });
    }
  };

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Grid>
            <SortableContext
              items={favorites.map((f) => f.id)}
              strategy={rectSortingStrategy}
            >
              {favorites && favorites.length > 0 ? (
                favorites.map((activity) => (
                  <SortableActivity key={activity.id} activity={activity} />
                ))
              ) : (
                <Grid.Col span={12}>
                  <Text>Vous n&apos;avez pas encore de favoris.</Text>
                </Grid.Col>
              )}
            </SortableContext>
          </Grid>
        </DndContext>
      </Stack>
    </>
  );
};

export default withAuth(Profile);
