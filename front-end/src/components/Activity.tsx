import { ActivityFragment } from "@/graphql/generated/types";
import { useGlobalStyles } from "@/utils";
import { ActionIcon, Badge, Button, Card, Group, Image, Text } from "@mantine/core";
import { useFavorite } from "@/hooks";
import { IconHeart } from "@tabler/icons-react";
import Link from "next/link";

interface ActivityProps {
  activity: ActivityFragment;
}

export function Activity({ activity }: ActivityProps) {
  const { classes } = useGlobalStyles();
  const { isFavorite, toggleFavorite, isLoading } = useFavorite(activity.id);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
          <Image
            src="https://dummyimage.com/480x4:3"
            height={160}
            alt="random image of city"
          />
        </Card.Section>

        <Group position="apart" mt="md" mb="xs" noWrap>
          <Text weight={500} className={classes.ellipsis}>
            {activity.name}
          </Text>
          <ActionIcon
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite();
            }}
            loading={isLoading}
            variant="transparent"
            color={isFavorite ? "red" : "gray"}
          >
            <IconHeart
              size="1.2rem"
              fill={isFavorite ? "currentColor" : "none"}
            />
          </ActionIcon>
        </Group>

        <Group mt="md" mb="xs">
          <Badge color="pink" variant="light">
            {activity.city}
          </Badge>
          <Badge color="yellow" variant="light">
            {`${activity.price}€/j`}
          </Badge>
        </Group>

        <Text size="sm" color="dimmed" className={classes.ellipsis}>
          {activity.description}
        </Text>

        {activity.createdAt && (
          <Text size="xs" color="dimmed" mt="md">
            Créé le : {new Date(activity.createdAt).toLocaleDateString()}
          </Text>
        )}

      <Link href={`/activities/${activity.id}`} className={classes.link}>
        <Button variant="light" color="blue" fullWidth mt="md" radius="md">
          Voir plus
        </Button>
      </Link>
    </Card>
  );
}
