import gql from "graphql-tag";
import ActivityFragment from "../../fragments/activity";

const GetUser = gql`
  query GetUser {
    getMe {
      id
      firstName
      lastName
      email
      favorites(first: 50) {
        totalCount
        edges {
          node {
            ...Activity
          }
        }
      }
    }
  }
  ${ActivityFragment}
`;

export default GetUser;
