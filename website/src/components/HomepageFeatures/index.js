/* eslint-disable import/no-unresolved */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-array-index-key */
/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/jsx-filename-extension */
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Simplifies Immutable Updates',
    description: (
      <>
        Writing immutable updates by hand is usually difficult, prone to errors,
        and cumbersome. Mutative helps us write simpler immutable updates with{' '}
        <code>mutative</code> logic.
      </>
    ),
  },
  {
    title: 'High Performance',
    description: (
      <>
        Mutative is faster than naive handcrafted reducer, and more than 10x
        faster than Immer.
      </>
    ),
  },
  {
    title: 'Powerful',
    description: (
      <>
        Mutative supports custom shallow copying. It enables the custom marking
        of mutable and immutable data. It also supports JSON patches
        specification, strict mode, Reducers, and more.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
