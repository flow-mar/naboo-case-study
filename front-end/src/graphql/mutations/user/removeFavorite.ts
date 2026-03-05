import gql from "graphql-tag";
import ActivityFragment from "../../fragments/activity";

const RemoveFavorite = gql`
  mutation RemoveFavorite($activityId: String!) {
    removeFavorite(activityId: $activityId) {
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

export default RemoveFavorite;
