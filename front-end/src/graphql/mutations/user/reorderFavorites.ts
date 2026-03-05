import gql from "graphql-tag";
import ActivityFragment from "../../fragments/activity";

const ReorderFavorites = gql`
  mutation ReorderFavorites($ids: [String!]!) {
    reorderFavorites(ids: $ids) {
      id
      firstName
      lastName
      email
      favorites {
        ...Activity
      }
    }
  }
  ${ActivityFragment}
`;

export default ReorderFavorites;
