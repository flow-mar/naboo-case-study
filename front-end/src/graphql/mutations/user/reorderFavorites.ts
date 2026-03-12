import gql from "graphql-tag";

const ReorderFavorites = gql`
  mutation ReorderFavorites($ids: [String!]!) {
    reorderFavorites(ids: $ids) {
      ids
      favoritesCount
    }
  }
`;

export default ReorderFavorites;
