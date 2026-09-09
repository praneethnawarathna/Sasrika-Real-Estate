using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Services;

public interface IPropertyService
{
    List<Property> GetAll(PropertyQueryParameters? query = null);
    Property? GetById(Guid id);
    Property Create(CreatePropertyDto dto);
}