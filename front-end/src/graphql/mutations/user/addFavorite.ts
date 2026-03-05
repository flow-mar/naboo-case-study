import gql from "graphql-tag";
import ActivityFragment from "../../fragments/activity";

const AddFavorite = gql`
  mutation AddFavorite($activityId: String!) {
    addFavorite(activityId: $activityId) {
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

export default AddFavorite;
