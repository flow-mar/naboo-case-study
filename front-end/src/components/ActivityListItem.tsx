import { ActivityFragment } from "@/graphql/generated/types";
import { useGlobalStyles } from "@/utils";
import { ActionIcon, Box, Button, Flex, Image, Text } from "@mantine/core";
import { useFavorite } from "@/hooks";
import { IconHeart } from "@tabler/icons-react";
import Link from "next/link";

interface ActivityListItemProps {
  activity: ActivityFragment;
}

export function ActivityListItem({ activity }: ActivityListItemProps) {
  const { classes } = useGlobalStyles();
  const { isFavorite, toggleFavorite, isLoading } = useFavorite(activity.id);

  return (
    <Flex align="center" justify="space-between">
      <Flex gap="md" align="center">
        <Image
          src="https://dummyimage.com/125"
          radius="md"
          alt="random image of city"
          height="125"
          width="125"
        />
        <Box sx={{ maxWidth: "300px" }}>
          <Text className={classes.ellipsis}>{activity.city}</Text>
          <Text className={classes.ellipsis}>{activity.name}</Text>
          <Text className={classes.ellipsis}>{activity.description}</Text>
          <Text
            weight="bold"
            className={classes.ellipsis}
          >{`${activity.price}€/j`}</Text>
          <ActionIcon
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite();
            }}
            loading={isLoading}
            variant="transparent"
            color={isFavorite ? "red" : "gray"}
            mt="xs"
          >
            <IconHeart
              size="1.2rem"
              fill={isFavorite ? "currentColor" : "none"}
            />
          </ActionIcon>
        </Box>
      </Flex>
      <Link href={`/activities/${activity.id}`} className={classes.link}>
        <Button variant="outline" color="dark">
          Voir plus
        </Button>
      </Link>
    </Flex>
  );
}
