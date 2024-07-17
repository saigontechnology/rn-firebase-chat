import React from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { PreviewLink } from './PreviewLink';

export type LinksType = {
  [date: string]: string[];
};

export type SectionData = {
  title: string;
  data: readonly string[];
};

interface LinkProps {
  renderCustomLink?: () => JSX.Element;
  links: SectionData[];
}

export const Links: React.FC<LinkProps> = ({ renderCustomLink, links }) => {
  const renderItemLink = ({ item, index }: { item: string; index: number }) => (
    <View key={index} style={styles.itemContainer}>
      <PreviewLink link={item} />
    </View>
  );
  if (!links) return null;

  if (renderCustomLink) return renderCustomLink();
  return (
    <SectionList
      sections={links}
      keyExtractor={(item, index) => `${index}-${item[index]}`}
      renderItem={renderItemLink}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.header}>{title}</Text>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});
