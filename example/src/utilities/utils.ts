interface HasIdAndName {
  id?: string;
  name?: string;
}

type DetailKey = 'id' | 'name';

export const getDetailArray = <T extends HasIdAndName>(
  array: T[],
  key: DetailKey,
): (string | undefined)[] => {
  return array.map(item => item[key]);
};
