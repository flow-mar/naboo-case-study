import gql from "graphql-tag";

const AddFavorite = gql`
  mutation AddFavorite($activityId: String!) {
    addFavorite(activityId: $activityId) {
      activityId
      isFavorite
      favoritesCount
    }
  }
`;

export default AddFavorite;
