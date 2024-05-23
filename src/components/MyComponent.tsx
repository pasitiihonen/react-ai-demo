import * as React from "react";

type Animal = {
  name: string;
  lifespan: number;
};

type AnimalListItemProps = {
  index: number;
  name: string;
  lifespan: number;
};

const AnimalListItem: React.FC<AnimalListItemProps> = ({
  index,
  name,
  lifespan,
}) => (
  <div className="animal-list-item">
    <div className="animal-info">
      <div className="animal-index">{index}</div>
      <div className="animal-name">{name}</div>
    </div>
    <div className="animal-lifespan">{lifespan}</div>
  </div>
);

const MyComponent: React.FC = () => {
  const [animals, setAnimals] = React.useState<Animal[]>([]);

  const fetchData = async () => {
    const response = await fetch("/data/AZA_MLE_Jul2018_semicolon.csv");
    const data = await response.text();
    const parsedData = data
      .trim()
      .split("\n")
      .slice(1) // Skip the header row
      .map((line) => {
        const [
          commonName,
          scientificName,
          taxonClass,
          overallSampleSize,
          overallMedianLifeExpectancy,
          /*... other fields ...*/
        ] = line.split(";");
        return {
          name: commonName,
          lifespan: parseFloat(overallMedianLifeExpectancy),
        };
      })
      .sort((a, b) => b.lifespan - a.lifespan) // Sort by lifespan, descending
      .slice(0, 10); // Take the top 10
    setAnimals(parsedData);
  };

  return (
    <>
      <div className="main-wrapper">
        <section className="content-section">
          <header className="header" onClick={fetchData}>
            Get data
          </header>
          <article className="article">
            <h1 className="title">Top 10 longest living zoo animals</h1>

            <div className="table-header">
              <span className="table-header-item">#</span>
              <span className="table-header-item">Animal</span>
              <span className="table-header-item table-header-item-right">
                Lifespan (years)
              </span>
            </div>

            {animals.map((animal, index) => (
              <AnimalListItem
                key={index}
                index={index + 1}
                name={animal.name}
                lifespan={animal.lifespan}
              />
            ))}
          </article>
        </section>
      </div>
      <style jsx>{`
        .main-wrapper {
          align-items: center;
          background-color: #fff;
          display: flex;
          max-width: 625px;
          flex-direction: column;
          font-size: 16px;
          line-height: 150%;
          padding: 38px 60px 80px;
        }

        @media (max-width: 991px) {
          .main-wrapper {
            padding: 0 20px;
          }
        }

        .content-section {
          display: flex;
          width: 335px;
          max-width: 100%;
          flex-direction: column;
        }

        .header {
          font-family: Inter, sans-serif;
          justify-content: center;
          border-radius: 8px;
          box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.05);
          background-color: #000;
          color: #fff;
          font-weight: 500;
          padding: 14px 24px;
          text-align: center;
          cursor: pointer;
        }

        @media (max-width: 991px) {
          .header {
            padding: 14px 20px;
          }
        }

        .article {
          border-radius: 8px;
          box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(224, 224, 224, 1);
          display: flex;
          margin-top: 18px;
          flex-direction: column;
          padding: 30px 24px 14px;
        }

        @media (max-width: 991px) {
          .article {
            padding: 30px 20px 14px;
          }
        }

        .title {
          font-family: Inter, sans-serif;
          font-weight: 600;
          margin: 0;
        }

        .table-header {
          display: flex;
          margin-top: 25px;
          gap: 20px;
          color: #828282;
          font-weight: 600;
        }

        .table-header-item {
          font-family: Inter, sans-serif;
        }

        .table-header-item-right {
          text-align: right;
          flex-grow: 1;
        }

        .animal-list-item {
          border-top: 1px solid rgba(224, 224, 224, 1);
          display: flex;
          margin-top: 7px;
          width: 100%;
          gap: 20px;
          white-space: nowrap;
          justify-content: space-between;
          padding: 18px 4px;
        }

        @media (max-width: 991px) {
          .animal-list-item {
            white-space: initial;
          }
        }

        .animal-info {
          display: flex;
          gap: 20px;
          font-weight: 500;
        }

        .animal-index {
          font-family: Inter, sans-serif;
        }

        .animal-name {
          font-family: Inter, sans-serif;
        }

        .animal-lifespan {
          text-align: right;
          font-family: Inter, sans-serif;
          font-weight: 400;
        }
      `}</style>
    </>
  );
};

export default MyComponent;
