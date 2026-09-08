using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Services;

public interface IPropertyService
{
    List<Property> GetAll();
    Property? GetById(Guid id);
    Property Create(CreatePropertyDto dto);
}