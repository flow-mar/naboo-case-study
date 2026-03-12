import { useAuth } from "@/hooks";
import { useApolloClient, useMutation } from "@apollo/client";
import AddFavorite from "@/graphql/mutations/user/addFavorite";
import RemoveFavorite from "@/graphql/mutations/user/removeFavorite";
import GetUser from "@/graphql/queries/auth/getUser";
import {
  AddFavoriteMutation,
  AddFavoriteMutationVariables,
  GetUserQuery,
  GetUserQueryVariables,
  RemoveFavoriteMutation,
  RemoveFavoriteMutationVariables,
} from "@/graphql/generated/types";
import { useSnackbar } from "./useSnackbar";

const MAX_FAVORITES = 50;

export function useFavorite(activityId: string) {
  const { user, setUser } = useAuth();
  const snackbar = useSnackbar();
  const apolloClient = useApolloClient();

  const favoriteNodes = user?.favorites?.edges?.map((e) => e.node) ?? [];
  const favoritesCount = user?.favorites?.totalCount ?? 0;

  const isFavorite = favoriteNodes.some((fav) => fav.id === activityId);

  const refreshUser = async () => {
    const { data } = await apolloClient.query<GetUserQuery, GetUserQueryVariables>({
      query: GetUser,
      fetchPolicy: "network-only",
    });
    setUser(data.getMe);
  };

  const [addFavoriteMutation, { loading: adding }] = useMutation<
    AddFavoriteMutation,
    AddFavoriteMutationVariables
  >(AddFavorite, {
    onCompleted: () => refreshUser(),
  });

  const [removeFavoriteMutation, { loading: removing }] = useMutation<
    RemoveFavoriteMutation,
    RemoveFavoriteMutationVariables
  >(RemoveFavorite, {
    onCompleted: () => refreshUser(),
  });

  const toggleFavorite = async () => {
    if (!user) {
      snackbar.error("Vous devez être connecté pour ajouter un favori");
      return;
    }

    if (!isFavorite && favoritesCount >= MAX_FAVORITES) {
      snackbar.error("Vous avez déjà 50 favoris");
      return;
    }

    try {
      if (isFavorite) {
        await removeFavoriteMutation({ variables: { activityId } });
        snackbar.success("Activité retirée des favoris");
      } else {
        await addFavoriteMutation({ variables: { activityId } });
        snackbar.success("Activité ajoutée aux favoris");
      }
    } catch (err) {
      snackbar.error("Une erreur est survenue");
    }
  };

  return {
    isFavorite,
    toggleFavorite,
    isLoading: adding || removing,
  };
}
