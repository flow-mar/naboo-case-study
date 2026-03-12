import gql from "graphql-tag";

const RemoveFavorite = gql`
  mutation RemoveFavorite($activityId: String!) {
    removeFavorite(activityId: $activityId) {
      activityId
      isFavorite
      favoritesCount
    }
  }
`;

export default RemoveFavorite;
