import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  SectionListProps,
  DefaultSectionT,
} from 'react-native';
import { LinkCard, LinkCardPropsWithoutText } from './LinkCard';
import { SectionData } from '../../../interfaces';

interface LinkListProps<ItemT, SectionT>
  extends SectionListProps<ItemT, SectionT> {
  renderCustomLink?: () => JSX.Element;
  links: SectionData[];
  renderCustomHeader?: (title: string) => JSX.Element | null;
  linkCardProps?: LinkCardPropsWithoutText;
}

export type LinkListPropsWithoutSection<ItemT, SectionT> = Omit<
  LinkListProps<ItemT, SectionT>,
  'sections'
>;

export const LinkList: React.FC<
  LinkListPropsWithoutSection<any, DefaultSectionT>
> = ({
  renderCustomLink,
  renderCustomHeader,
  links,
  linkCardProps,
  ...props
}) => {
  const renderItemLink = ({ item, index }: { item: string; index: number }) => (
    <View key={index} style={styles.itemContainer}>
      <LinkCard link={item} {...linkCardProps} />
    </View>
  );
  if (!links) return null;

  if (renderCustomLink) return renderCustomLink();
  return (
    <SectionList
      sections={links}
      keyExtractor={(item, index) => `${index}-${item[index]}`}
      renderItem={renderItemLink}
      stickyHeaderHiddenOnScroll
      renderSectionHeader={({ section: { title } }) =>
        renderCustomHeader ? (
          renderCustomHeader(title)
        ) : (
          <Text style={[styles.header]}>{title}</Text>
        )
      }
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  itemContainer: {
    padding: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});
