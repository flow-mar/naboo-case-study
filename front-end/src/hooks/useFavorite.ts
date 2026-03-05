import { useAuth } from "@/hooks";
import { useMutation } from "@apollo/client";
import AddFavorite from "@/graphql/mutations/user/addFavorite";
import RemoveFavorite from "@/graphql/mutations/user/removeFavorite";
import {
  AddFavoriteMutation,
  AddFavoriteMutationVariables,
  RemoveFavoriteMutation,
  RemoveFavoriteMutationVariables,
} from "@/graphql/generated/types";
import { useSnackbar } from "./useSnackbar";

export function useFavorite(activityId: string) {
  const { user, setUser } = useAuth();
  const snackbar = useSnackbar();

  const isFavorite = user?.favorites?.some((fav) => fav.id === activityId) ?? false;

  const [addFavoriteMutation, { loading: adding }] = useMutation<
    AddFavoriteMutation,
    AddFavoriteMutationVariables
  >(AddFavorite, {
    onCompleted: (data) => {
      if (data.addFavorite) {
        setUser(data.addFavorite);
      }
    },
  });

  const [removeFavoriteMutation, { loading: removing }] = useMutation<
    RemoveFavoriteMutation,
    RemoveFavoriteMutationVariables
  >(RemoveFavorite, {
    onCompleted: (data) => {
      if (data.removeFavorite) {
        setUser(data.removeFavorite);
      }
    },
  });

  const toggleFavorite = async () => {
    if (!user) {
      snackbar.error("Vous devez être connecté pour ajouter un favori");
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
